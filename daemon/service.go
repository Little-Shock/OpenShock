package daemon

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"
)

type Config struct {
	StatePath    string
	AckPath      string
	WorktreeRoot string
	Hooks        RecoveryHooks
}

type Service struct {
	store     *PersistentStore
	ackStore  *DurableAckStore
	worktrees *WorktreeManager
	hooks     RecoveryHooks
	now       func() time.Time
}

type CreateLaneInput struct {
	IssueID  string
	TopicID  string
	Branch   string
	Metadata map[string]string
}

type EnqueueRunInput struct {
	LaneID    string
	SessionID string
	Metadata  map[string]string
}

type ExecutionFeedbackInput struct {
	Source          string
	Kind            string
	Severity        string
	Message         string
	Metadata        map[string]string
	RequestApproval bool
	ApprovalReason  string
}

type RequestExecutionApprovalHoldInput struct {
	Reason      string
	RequestedBy string
	Metadata    map[string]string
}

type ResolveExecutionApprovalHoldInput struct {
	Approved       bool
	ResolvedBy     string
	ResolutionNote string
}

func NewService(cfg Config) (*Service, error) {
	store, err := OpenStore(cfg.StatePath)
	if err != nil {
		return nil, err
	}
	ackStore, err := OpenDurableAckStore(cfg.AckPath)
	if err != nil {
		return nil, err
	}
	worktrees, err := NewWorktreeManager(cfg.WorktreeRoot)
	if err != nil {
		return nil, err
	}

	hooks := cfg.Hooks
	if hooks == nil {
		hooks = NoopRecoveryHooks{}
	}

	svc := &Service{
		store:     store,
		ackStore:  ackStore,
		worktrees: worktrees,
		hooks:     hooks,
		now:       time.Now,
	}
	if err := svc.syncAckFromDurableStore(); err != nil {
		return nil, err
	}

	return svc, nil
}

func (s *Service) CreateLane(_ context.Context, in CreateLaneInput) (Lane, error) {
	if strings.TrimSpace(in.IssueID) == "" {
		return Lane{}, fmt.Errorf("issue id is required")
	}
	if strings.TrimSpace(in.TopicID) == "" {
		return Lane{}, fmt.Errorf("topic id is required")
	}

	laneID, err := newID("lane")
	if err != nil {
		return Lane{}, err
	}
	worktreePath, err := s.worktrees.EnsureLane(laneID)
	if err != nil {
		return Lane{}, err
	}

	branch := strings.TrimSpace(in.Branch)
	if branch == "" {
		branch = fmt.Sprintf("topic/%s", in.TopicID)
	}

	now := s.now().UTC()
	lane := Lane{
		ID:           laneID,
		IssueID:      strings.TrimSpace(in.IssueID),
		TopicID:      strings.TrimSpace(in.TopicID),
		Branch:       branch,
		WorktreePath: worktreePath,
		Metadata:     cloneMap(in.Metadata),
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.store.Transaction(func(snapshot *Snapshot) error {
		snapshot.Lanes[lane.ID] = lane
		return nil
	}); err != nil {
		return Lane{}, err
	}
	return lane, nil
}

func (s *Service) EnqueueRun(_ context.Context, in EnqueueRunInput) (Run, error) {
	if strings.TrimSpace(in.LaneID) == "" {
		return Run{}, fmt.Errorf("lane id is required")
	}

	lane, err := s.GetLane(in.LaneID)
	if err != nil {
		return Run{}, err
	}

	runID, err := newID("run")
	if err != nil {
		return Run{}, err
	}
	if _, err := s.worktrees.EnsureRunPath(lane.ID, runID); err != nil {
		return Run{}, err
	}

	sessionID := strings.TrimSpace(in.SessionID)
	if sessionID == "" {
		sessionID, err = newID("session")
		if err != nil {
			return Run{}, err
		}
	}

	now := s.now().UTC()
	run := Run{
		ID:            runID,
		LaneID:        lane.ID,
		SessionID:     sessionID,
		State:         RunStateQueued,
		Sequence:      0,
		AckedSequence: 0,
		Metadata:      cloneMap(in.Metadata),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := s.store.Transaction(func(snapshot *Snapshot) error {
		run = appendRunEvent(snapshot, run, "run_enqueued", "run queued", nil, now)
		snapshot.Runs[run.ID] = run
		return nil
	}); err != nil {
		return Run{}, err
	}

	return run, nil
}

func (s *Service) DispatchRun(_ context.Context, runID, runtimeID string) (Run, error) {
	if strings.TrimSpace(runtimeID) == "" {
		return Run{}, fmt.Errorf("runtime id is required")
	}
	return s.transitionRun(runID, RunStateDispatched, "run_dispatched", "run dispatched to runtime", map[string]string{
		"runtime_id": runtimeID,
	}, func(run *Run, now time.Time) {
		run.RuntimeID = strings.TrimSpace(runtimeID)
		run.RecoveryNeeded = false
	})
}

func (s *Service) MarkRunRunning(_ context.Context, runID string) (Run, error) {
	return s.transitionRun(runID, RunStateRunning, "run_started", "run is running", nil, func(run *Run, now time.Time) {
		run.StartedAt = &now
		run.RecoveryNeeded = false
	})
}

func (s *Service) RequireApproval(_ context.Context, runID, reason string) (Run, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "approval required"
	}
	return s.transitionRun(runID, RunStateApprovalRequired, "run_approval_required", reason, nil, func(run *Run, _ time.Time) {
		run.RecoveryNeeded = false
	})
}

func (s *Service) ResumeFromApproval(_ context.Context, runID, approver string) (Run, error) {
	approver = strings.TrimSpace(approver)
	if approver == "" {
		approver = "unknown"
	}
	return s.transitionRun(runID, RunStateRunning, "run_approval_granted", "run resumed after approval", map[string]string{
		"approver": approver,
	}, func(run *Run, _ time.Time) {
		run.RecoveryNeeded = false
	})
}

func (s *Service) CompleteRun(_ context.Context, runID, summary string) (Run, error) {
	summary = strings.TrimSpace(summary)
	if summary == "" {
		summary = "run completed"
	}
	return s.transitionRun(runID, RunStateCompleted, "run_completed", summary, nil, func(run *Run, now time.Time) {
		run.FinishedAt = &now
		run.LastError = ""
		run.RecoveryNeeded = false
	})
}

func (s *Service) FailRun(_ context.Context, runID, reason string) (Run, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "run failed"
	}
	return s.transitionRun(runID, RunStateFailed, "run_failed", reason, nil, func(run *Run, now time.Time) {
		run.FinishedAt = &now
		run.LastError = reason
		run.RecoveryNeeded = false
	})
}

func (s *Service) BlockRun(_ context.Context, runID, reason string) (Run, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "run blocked"
	}
	return s.transitionRun(runID, RunStateBlocked, "run_blocked", reason, nil, func(run *Run, now time.Time) {
		run.LastError = reason
		run.RecoveryNeeded = true
	})
}

func (s *Service) CancelRun(_ context.Context, runID, reason string) (Run, error) {
	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "run cancelled"
	}
	return s.transitionRun(runID, RunStateCancelled, "run_cancelled", reason, nil, func(run *Run, now time.Time) {
		run.FinishedAt = &now
		run.LastError = reason
		run.RecoveryNeeded = false
	})
}

func (s *Service) AckRun(_ context.Context, runID string, sequence uint64) (Run, error) {
	run, err := s.GetRun(runID)
	if err != nil {
		return Run{}, err
	}
	if sequence > run.Sequence {
		return Run{}, fmt.Errorf("cannot ack sequence %d beyond latest sequence %d", sequence, run.Sequence)
	}
	if err := s.ackStore.Ack(runID, sequence); err != nil {
		return Run{}, err
	}

	now := s.now().UTC()
	var updated Run
	if err := s.store.Transaction(func(snapshot *Snapshot) error {
		run, ok := snapshot.Runs[runID]
		if !ok {
			return ErrRunNotFound
		}
		if sequence > run.AckedSequence {
			run.AckedSequence = sequence
			run.UpdatedAt = now
			snapshot.Runs[runID] = run
		}
		updated = run
		return nil
	}); err != nil {
		return Run{}, err
	}
	return updated, nil
}

func (s *Service) IngestExecutionFeedback(_ context.Context, runID string, in ExecutionFeedbackInput) (ExecutionFeedback, *ExecutionApprovalHold, Run, error) {
	message := strings.TrimSpace(in.Message)
	if message == "" {
		return ExecutionFeedback{}, nil, Run{}, fmt.Errorf("feedback message is required")
	}

	feedbackID, err := newID("feedback")
	if err != nil {
		return ExecutionFeedback{}, nil, Run{}, err
	}
	now := s.now().UTC()
	feedback := ExecutionFeedback{
		ID:        feedbackID,
		RunID:     runID,
		Source:    defaultString(in.Source, "runtime"),
		Kind:      defaultString(in.Kind, "general"),
		Severity:  defaultString(in.Severity, "info"),
		Message:   message,
		Metadata:  cloneMap(in.Metadata),
		CreatedAt: now,
	}

	var hold *ExecutionApprovalHold
	var updated Run
	err = s.store.Transaction(func(snapshot *Snapshot) error {
		run, ok := snapshot.Runs[runID]
		if !ok {
			return ErrRunNotFound
		}
		if run.State.IsTerminal() {
			return fmt.Errorf("cannot ingest feedback for terminal run state %s", run.State)
		}

		snapshot.Feedbacks[runID] = append(snapshot.Feedbacks[runID], feedback)
		run = appendRunEvent(snapshot, run, "execution_feedback_ingested", feedback.Message, map[string]string{
			"feedback_id": feedback.ID,
			"source":      feedback.Source,
			"kind":        feedback.Kind,
			"severity":    feedback.Severity,
		}, now)

		if in.RequestApproval {
			requestedHold, nextRun, holdErr := requestExecutionApprovalHold(snapshot, run, now, RequestExecutionApprovalHoldInput{
				Reason:      in.ApprovalReason,
				RequestedBy: feedback.Source,
				Metadata: map[string]string{
					"trigger":     "execution_feedback",
					"feedback_id": feedback.ID,
				},
			})
			if holdErr != nil {
				return holdErr
			}
			hold = &requestedHold
			run = nextRun
		}

		snapshot.Runs[run.ID] = run
		updated = run
		return nil
	})
	if err != nil {
		return ExecutionFeedback{}, nil, Run{}, err
	}

	return feedback, hold, updated, nil
}

func (s *Service) RequestExecutionApprovalHold(_ context.Context, runID string, in RequestExecutionApprovalHoldInput) (ExecutionApprovalHold, Run, error) {
	now := s.now().UTC()
	var hold ExecutionApprovalHold
	var updated Run

	err := s.store.Transaction(func(snapshot *Snapshot) error {
		run, ok := snapshot.Runs[runID]
		if !ok {
			return ErrRunNotFound
		}
		if run.State.IsTerminal() {
			return fmt.Errorf("cannot request approval hold for terminal run state %s", run.State)
		}

		requestedHold, nextRun, holdErr := requestExecutionApprovalHold(snapshot, run, now, in)
		if holdErr != nil {
			return holdErr
		}
		snapshot.Runs[nextRun.ID] = nextRun
		hold = requestedHold
		updated = nextRun
		return nil
	})
	if err != nil {
		return ExecutionApprovalHold{}, Run{}, err
	}
	return hold, updated, nil
}

func (s *Service) ResolveExecutionApprovalHold(_ context.Context, runID, holdID string, in ResolveExecutionApprovalHoldInput) (ExecutionApprovalHold, Run, error) {
	holdID = strings.TrimSpace(holdID)
	if holdID == "" {
		return ExecutionApprovalHold{}, Run{}, fmt.Errorf("hold id is required")
	}
	resolvedBy := defaultString(in.ResolvedBy, "unknown")
	resolutionNote := defaultString(in.ResolutionNote, "resolved")

	now := s.now().UTC()
	var resolved ExecutionApprovalHold
	var updated Run

	err := s.store.Transaction(func(snapshot *Snapshot) error {
		run, ok := snapshot.Runs[runID]
		if !ok {
			return ErrRunNotFound
		}

		holds := snapshot.Holds[runID]
		found := false
		for idx, candidate := range holds {
			if candidate.ID != holdID {
				continue
			}
			found = true
			if candidate.State != ApprovalHoldStateActive {
				return fmt.Errorf("approval hold %s already resolved", holdID)
			}

			candidate.ResolvedBy = resolvedBy
			candidate.ResolutionNote = resolutionNote
			candidate.ResolvedAt = &now
			if in.Approved {
				candidate.State = ApprovalHoldStateReleased
			} else {
				candidate.State = ApprovalHoldStateRejected
			}
			holds[idx] = candidate
			resolved = candidate
			break
		}
		if !found {
			return ErrApprovalHoldNotFound
		}
		snapshot.Holds[runID] = holds

		eventType := "execution_approval_hold_released"
		if !in.Approved {
			eventType = "execution_approval_hold_rejected"
		}
		run = appendRunEvent(snapshot, run, eventType, resolutionNote, map[string]string{
			"hold_id":     resolved.ID,
			"resolved_by": resolved.ResolvedBy,
		}, now)

		if in.Approved {
			if run.State == RunStateApprovalRequired && activeApprovalHoldCount(snapshot.Holds[runID]) == 0 {
				if err := validateRunTransition(run.State, RunStateRunning); err != nil {
					return err
				}
				run.State = RunStateRunning
				if run.StartedAt == nil {
					run.StartedAt = &now
				}
				run.RecoveryNeeded = false
				run = appendRunEvent(snapshot, run, "execution_approval_holds_cleared", "all execution approval holds released", nil, now)
			}
		} else {
			if run.State != RunStateBlocked {
				if err := validateRunTransition(run.State, RunStateBlocked); err != nil {
					return err
				}
				run.State = RunStateBlocked
			}
			run.LastError = fmt.Sprintf("execution approval rejected: %s", resolutionNote)
			run.RecoveryNeeded = true
			run = appendRunEvent(snapshot, run, "run_blocked", run.LastError, nil, now)
		}

		snapshot.Runs[runID] = run
		updated = run
		return nil
	})
	if err != nil {
		return ExecutionApprovalHold{}, Run{}, err
	}
	return resolved, updated, nil
}

func (s *Service) RecoverInterruptedRuns(ctx context.Context) error {
	runs := s.recoveryCandidates()
	for _, run := range runs {
		if err := s.hooks.OnRunRecoveryCandidate(ctx, run); err != nil {
			s.hooks.OnRunRecoveryFailed(ctx, run, err)
			if _, failErr := s.FailRun(ctx, run.ID, fmt.Sprintf("recovery hook failed: %v", err)); failErr != nil {
				return failErr
			}
			continue
		}

		switch run.State {
		case RunStateDispatched, RunStateRunning:
			if _, err := s.BlockRun(ctx, run.ID, "daemon restart: run requires manual resume"); err != nil {
				return err
			}
		case RunStateApprovalRequired:
			now := s.now().UTC()
			if err := s.store.Transaction(func(snapshot *Snapshot) error {
				reloaded, ok := snapshot.Runs[run.ID]
				if !ok {
					return ErrRunNotFound
				}
				reloaded.RecoveryNeeded = true
				reloaded = appendRunEvent(snapshot, reloaded, "run_recovery_pending_approval", "daemon restart: run waiting for approval", nil, now)
				snapshot.Runs[run.ID] = reloaded
				return nil
			}); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *Service) GetLane(laneID string) (Lane, error) {
	snapshot := s.store.Snapshot()
	lane, ok := snapshot.Lanes[laneID]
	if !ok {
		return Lane{}, ErrLaneNotFound
	}
	return lane, nil
}

func (s *Service) GetRun(runID string) (Run, error) {
	snapshot := s.store.Snapshot()
	run, ok := snapshot.Runs[runID]
	if !ok {
		return Run{}, ErrRunNotFound
	}
	return run, nil
}

func (s *Service) ListLaneRuns(laneID string) ([]Run, error) {
	if _, err := s.GetLane(laneID); err != nil {
		return nil, err
	}

	snapshot := s.store.Snapshot()
	runs := make([]Run, 0)
	for _, run := range snapshot.Runs {
		if run.LaneID == laneID {
			runs = append(runs, run)
		}
	}

	sort.Slice(runs, func(i, j int) bool {
		return runs[i].CreatedAt.Before(runs[j].CreatedAt)
	})
	return runs, nil
}

func (s *Service) ListRunEvents(runID string) ([]RunEvent, error) {
	if _, err := s.GetRun(runID); err != nil {
		return nil, err
	}
	snapshot := s.store.Snapshot()
	events := snapshot.Events[runID]
	copied := make([]RunEvent, len(events))
	copy(copied, events)
	return copied, nil
}

func (s *Service) ListExecutionFeedback(runID string) ([]ExecutionFeedback, error) {
	if _, err := s.GetRun(runID); err != nil {
		return nil, err
	}
	snapshot := s.store.Snapshot()
	feedbacks := snapshot.Feedbacks[runID]
	copied := make([]ExecutionFeedback, len(feedbacks))
	copy(copied, feedbacks)
	return copied, nil
}

func (s *Service) ListExecutionApprovalHolds(runID string) ([]ExecutionApprovalHold, error) {
	if _, err := s.GetRun(runID); err != nil {
		return nil, err
	}
	snapshot := s.store.Snapshot()
	holds := snapshot.Holds[runID]
	copied := make([]ExecutionApprovalHold, len(holds))
	copy(copied, holds)
	return copied, nil
}

func (s *Service) transitionRun(
	runID string,
	to RunState,
	eventType string,
	message string,
	eventMetadata map[string]string,
	mutate func(run *Run, now time.Time),
) (Run, error) {
	now := s.now().UTC()
	var updated Run

	err := s.store.Transaction(func(snapshot *Snapshot) error {
		run, ok := snapshot.Runs[runID]
		if !ok {
			return ErrRunNotFound
		}
		if err := validateRunTransition(run.State, to); err != nil {
			return err
		}

		run.State = to
		run.UpdatedAt = now
		if mutate != nil {
			mutate(&run, now)
		}
		run = appendRunEvent(snapshot, run, eventType, message, eventMetadata, now)
		snapshot.Runs[runID] = run
		updated = run
		return nil
	})
	if err != nil {
		return Run{}, err
	}

	return updated, nil
}

func appendRunEvent(snapshot *Snapshot, run Run, eventType, message string, metadata map[string]string, now time.Time) Run {
	run.Sequence++
	run.UpdatedAt = now
	event := RunEvent{
		Sequence:  run.Sequence,
		RunID:     run.ID,
		Type:      eventType,
		State:     run.State,
		Message:   message,
		Metadata:  cloneMap(metadata),
		CreatedAt: now,
	}
	snapshot.Events[run.ID] = append(snapshot.Events[run.ID], event)
	return run
}

func (s *Service) syncAckFromDurableStore() error {
	acked := s.ackStore.Snapshot()
	if len(acked) == 0 {
		return nil
	}

	return s.store.Transaction(func(snapshot *Snapshot) error {
		for runID, sequence := range acked {
			run, ok := snapshot.Runs[runID]
			if !ok {
				continue
			}
			if sequence > run.Sequence {
				sequence = run.Sequence
			}
			if sequence > run.AckedSequence {
				run.AckedSequence = sequence
				run.UpdatedAt = s.now().UTC()
				snapshot.Runs[runID] = run
			}
		}
		return nil
	})
}

func (s *Service) recoveryCandidates() []Run {
	snapshot := s.store.Snapshot()
	candidates := make([]Run, 0)
	for _, run := range snapshot.Runs {
		switch run.State {
		case RunStateDispatched, RunStateRunning, RunStateApprovalRequired:
			candidates = append(candidates, run)
		}
	}
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].CreatedAt.Before(candidates[j].CreatedAt)
	})
	return candidates
}

func requestExecutionApprovalHold(snapshot *Snapshot, run Run, now time.Time, in RequestExecutionApprovalHoldInput) (ExecutionApprovalHold, Run, error) {
	reason := strings.TrimSpace(in.Reason)
	if reason == "" {
		reason = "execution-side approval hold"
	}
	requestedBy := defaultString(in.RequestedBy, "runtime")

	holdID, err := newID("hold")
	if err != nil {
		return ExecutionApprovalHold{}, Run{}, err
	}

	hold := ExecutionApprovalHold{
		ID:          holdID,
		RunID:       run.ID,
		State:       ApprovalHoldStateActive,
		Reason:      reason,
		RequestedBy: requestedBy,
		Metadata:    cloneMap(in.Metadata),
		CreatedAt:   now,
	}
	snapshot.Holds[run.ID] = append(snapshot.Holds[run.ID], hold)

	if run.State != RunStateApprovalRequired {
		if err := validateRunTransition(run.State, RunStateApprovalRequired); err != nil {
			return ExecutionApprovalHold{}, Run{}, err
		}
		run.State = RunStateApprovalRequired
	}
	run.RecoveryNeeded = false
	run = appendRunEvent(snapshot, run, "execution_approval_hold_requested", reason, map[string]string{
		"hold_id":      hold.ID,
		"requested_by": hold.RequestedBy,
	}, now)
	return hold, run, nil
}

func activeApprovalHoldCount(holds []ExecutionApprovalHold) int {
	count := 0
	for _, hold := range holds {
		if hold.State == ApprovalHoldStateActive {
			count++
		}
	}
	return count
}

func defaultString(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

func cloneMap(values map[string]string) map[string]string {
	if len(values) == 0 {
		return nil
	}
	cloned := make(map[string]string, len(values))
	for key, value := range values {
		cloned[key] = value
	}
	return cloned
}
