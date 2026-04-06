package daemon

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"
)

type IntegratedDaemon struct {
	cfg    SharedRuntimeConfig
	svc    *Service
	client *ServerClient
	cursor *PublishCursorStore
}

const (
	runtimeReadyPollInterval = 200 * time.Millisecond
	runtimeReadyPollAttempts = 15
	runtimeReadyStableChecks = 3
)

func NewIntegratedDaemon(cfg SharedRuntimeConfig) (*IntegratedDaemon, error) {
	svc, err := NewService(Config{
		StatePath:    cfg.Daemon.StatePath,
		AckPath:      cfg.Daemon.AckPath,
		WorktreeRoot: cfg.Daemon.WorktreeRoot,
	})
	if err != nil {
		return nil, err
	}
	cursorStore, err := OpenPublishCursorStore(cfg.Daemon.PublishCursorPath)
	if err != nil {
		return nil, err
	}

	return &IntegratedDaemon{
		cfg:    cfg,
		svc:    svc,
		client: NewServerClient(cfg.Server, nil),
		cursor: cursorStore,
	}, nil
}

func (d *IntegratedDaemon) Service() *Service {
	return d.svc
}

func (d *IntegratedDaemon) EnsureRuntimeReady(ctx context.Context) (RuntimeConfigResponse, error) {
	cfg, err := d.client.FetchRuntimeConfig(ctx)
	if err != nil {
		return RuntimeConfigResponse{}, err
	}
	if _, err := d.client.SeedFixtures(ctx); err != nil {
		return RuntimeConfigResponse{}, err
	}
	var lastSmoke RuntimeSmokeResponse
	readyStreak := 0
	var lastShellErr error
	expectedTopicID := strings.TrimSpace(cfg.SampleFixture.TopicID)
	for attempt := 1; attempt <= runtimeReadyPollAttempts; attempt++ {
		smoke, smokeErr := d.client.CheckSmoke(ctx)
		if smokeErr != nil {
			return RuntimeConfigResponse{}, smokeErr
		}
		lastSmoke = smoke
		topicReady := expectedTopicID != ""
		if smoke.SampleTopicReady && smoke.SampleTopicAgentCount > 0 && topicReady {
			readyStreak++
		} else {
			readyStreak = 0
		}
		if readyStreak >= runtimeReadyStableChecks {
			if err := d.verifyShellStateReady(ctx, expectedTopicID); err == nil {
				return cfg, nil
			} else {
				lastShellErr = err
				readyStreak = 0
			}
		}
		if attempt == runtimeReadyPollAttempts {
			break
		}
		timer := time.NewTimer(runtimeReadyPollInterval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return RuntimeConfigResponse{}, ctx.Err()
		case <-timer.C:
		}
	}

	if lastShellErr != nil {
		return RuntimeConfigResponse{}, fmt.Errorf(
			"runtime smoke looked ready but shell state not ready after fixture seed: sampleTopicReady=%t sampleTopicAgentCount=%d sampleFixtureTopicID=%q attempts=%d readyStreak=%d shellError=%v",
			lastSmoke.SampleTopicReady,
			lastSmoke.SampleTopicAgentCount,
			expectedTopicID,
			runtimeReadyPollAttempts,
			readyStreak,
			lastShellErr,
		)
	}
	return RuntimeConfigResponse{}, fmt.Errorf(
		"runtime smoke not ready after fixture seed: sampleTopicReady=%t sampleTopicAgentCount=%d sampleFixtureTopicID=%q attempts=%d readyStreak=%d",
		lastSmoke.SampleTopicReady,
		lastSmoke.SampleTopicAgentCount,
		expectedTopicID,
		runtimeReadyPollAttempts,
		readyStreak,
	)
}

func (d *IntegratedDaemon) verifyShellStateReady(ctx context.Context, expectedTopicID string) error {
	shellStateURL := strings.TrimSpace(d.cfg.ShellStateURL)
	if shellStateURL == "" {
		return nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, shellStateURL, nil)
	if err != nil {
		return fmt.Errorf("build shell state request: %w", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("get %s failed: %w", shellStateURL, err)
	}
	defer resp.Body.Close()

	payload, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if resp.StatusCode >= 300 {
		return fmt.Errorf("get %s failed: status=%d body=%s", shellStateURL, resp.StatusCode, strings.TrimSpace(string(payload)))
	}
	if expectedTopicID != "" && !strings.Contains(string(payload), expectedTopicID) {
		return fmt.Errorf("get %s missing expected topic %q", shellStateURL, expectedTopicID)
	}
	return nil
}

func (d *IntegratedDaemon) PublishRun(ctx context.Context, runID string) (int, error) {
	run, err := d.svc.GetRun(runID)
	if err != nil {
		return 0, err
	}
	lane, err := d.svc.GetLane(run.LaneID)
	if err != nil {
		return 0, err
	}
	events, err := d.svc.ListRunEvents(runID)
	if err != nil {
		return 0, err
	}
	feedbacks, err := d.svc.ListExecutionFeedback(runID)
	if err != nil {
		return 0, err
	}
	holds, err := d.svc.ListExecutionApprovalHolds(runID)
	if err != nil {
		return 0, err
	}

	cursor := d.cursor.Snapshot()
	publish, nextCursor := buildDaemonEventBatch(cursor, lane, run, events, feedbacks, holds)
	if len(publish) == 0 {
		return 0, nil
	}

	for _, daemonEvent := range publish {
		if err := d.client.PublishDaemonEvent(ctx, daemonEvent); err != nil {
			return 0, err
		}
	}
	if err := d.cursor.Save(nextCursor); err != nil {
		return 0, err
	}
	return len(publish), nil
}

func buildDaemonEventBatch(
	cursor PublishCursor,
	lane Lane,
	run Run,
	events []RunEvent,
	feedbacks []ExecutionFeedback,
	holds []ExecutionApprovalHold,
) ([]RuntimeDaemonEventRequest, PublishCursor) {
	next := cloneCursor(cursor)
	batch := make([]RuntimeDaemonEventRequest, 0)
	ordered := make([]eventEnvelope, 0)

	lastPublishedSeq := cursor.RunEventSequence[run.ID]
	for _, event := range events {
		if event.Sequence <= lastPublishedSeq {
			continue
		}
		ordered = append(ordered, eventEnvelope{
			timestamp: event.CreatedAt,
			sequence:  event.Sequence,
			event: RuntimeDaemonEventRequest{
				TopicID: lane.TopicID,
				Type:    DaemonEventStatusReport,
				Payload: map[string]any{
					"runId":     run.ID,
					"laneId":    lane.ID,
					"sessionId": run.SessionID,
					"runtimeId": run.RuntimeID,
					"event":     event.Type,
					"state":     event.State,
					"message":   event.Message,
					"sequence":  event.Sequence,
					"metadata":  event.Metadata,
				},
			},
		})
		if event.Sequence > next.RunEventSequence[run.ID] {
			next.RunEventSequence[run.ID] = event.Sequence
		}
	}

	for _, feedback := range feedbacks {
		if cursor.FeedbackSeen[feedback.ID] {
			continue
		}
		ordered = append(ordered, eventEnvelope{
			timestamp: feedback.CreatedAt,
			event: RuntimeDaemonEventRequest{
				TopicID: lane.TopicID,
				Type:    DaemonEventFeedbackIngest,
				Payload: map[string]any{
					"runId":      run.ID,
					"laneId":     lane.ID,
					"feedbackId": feedback.ID,
					"source":     feedback.Source,
					"kind":       feedback.Kind,
					"severity":   feedback.Severity,
					"message":    feedback.Message,
					"metadata":   feedback.Metadata,
				},
			},
		})
		next.FeedbackSeen[feedback.ID] = true
	}

	for _, hold := range holds {
		if cursor.HoldState[hold.ID] == string(hold.State) {
			continue
		}
		timestamp := hold.CreatedAt
		if hold.ResolvedAt != nil {
			timestamp = *hold.ResolvedAt
		}
		ordered = append(ordered, eventEnvelope{
			timestamp: timestamp,
			event: RuntimeDaemonEventRequest{
				TopicID: lane.TopicID,
				Type:    DaemonEventBlockerEscalation,
				Payload: map[string]any{
					"runId":          run.ID,
					"laneId":         lane.ID,
					"holdId":         hold.ID,
					"state":          hold.State,
					"reason":         hold.Reason,
					"requestedBy":    hold.RequestedBy,
					"resolvedBy":     hold.ResolvedBy,
					"resolutionNote": hold.ResolutionNote,
					"metadata":       hold.Metadata,
				},
			},
		})
		next.HoldState[hold.ID] = string(hold.State)
	}

	sort.SliceStable(ordered, func(i, j int) bool {
		if ordered[i].timestamp.Equal(ordered[j].timestamp) {
			return ordered[i].sequence < ordered[j].sequence
		}
		return ordered[i].timestamp.Before(ordered[j].timestamp)
	})

	for _, candidate := range ordered {
		batch = append(batch, candidate.event)
	}
	return batch, next
}

type eventEnvelope struct {
	timestamp time.Time
	sequence  uint64
	event     RuntimeDaemonEventRequest
}

func (d *IntegratedDaemon) IntegratedDemo(ctx context.Context, issueID, topicID string) (Lane, Run, int, error) {
	runtimeCfg, err := d.EnsureRuntimeReady(ctx)
	if err != nil {
		return Lane{}, Run{}, 0, fmt.Errorf("ensure runtime ready: %w", err)
	}

	resolvedTopicID := strings.TrimSpace(topicID)
	if resolvedTopicID == "" {
		resolvedTopicID = strings.TrimSpace(runtimeCfg.SampleFixture.TopicID)
	}
	if resolvedTopicID == "" {
		return Lane{}, Run{}, 0, fmt.Errorf("integrated demo topic is required: pass --topic or ensure runtime sampleFixture.topicId is set")
	}

	lane, err := d.svc.CreateLane(ctx, CreateLaneInput{IssueID: issueID, TopicID: resolvedTopicID})
	if err != nil {
		return Lane{}, Run{}, 0, err
	}
	run, err := d.svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		return Lane{}, Run{}, 0, err
	}
	if run, err = d.svc.DispatchRun(ctx, run.ID, d.cfg.RuntimeID); err != nil {
		return Lane{}, Run{}, 0, err
	}
	if run, err = d.svc.MarkRunRunning(ctx, run.ID); err != nil {
		return Lane{}, Run{}, 0, err
	}
	if _, _, run, err = d.svc.IngestExecutionFeedback(ctx, run.ID, ExecutionFeedbackInput{
		Source:          "runtime",
		Kind:            "integrated_demo",
		Severity:        "warning",
		Message:         "demo feedback entering integrated runtime",
		RequestApproval: true,
		ApprovalReason:  "demo hold",
	}); err != nil {
		return Lane{}, Run{}, 0, err
	}

	holds, err := d.svc.ListExecutionApprovalHolds(run.ID)
	if err != nil {
		return Lane{}, Run{}, 0, err
	}
	if len(holds) == 0 {
		return Lane{}, Run{}, 0, fmt.Errorf("expected hold after demo feedback")
	}
	if _, run, err = d.svc.ResolveExecutionApprovalHold(ctx, run.ID, holds[len(holds)-1].ID, ResolveExecutionApprovalHoldInput{
		Approved:       true,
		ResolvedBy:     "operator",
		ResolutionNote: "demo approve",
	}); err != nil {
		return Lane{}, Run{}, 0, err
	}

	if run, err = d.svc.CompleteRun(ctx, run.ID, "demo completed"); err != nil {
		return Lane{}, Run{}, 0, err
	}

	published, err := d.PublishRun(ctx, run.ID)
	if err != nil {
		return Lane{}, Run{}, 0, err
	}
	return lane, run, published, nil
}
