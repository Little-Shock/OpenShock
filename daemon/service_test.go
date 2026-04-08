package daemon

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

type captureRecoveryHooks struct {
	candidates []string
	failures   []string
	failOnRun  string
}

func (h *captureRecoveryHooks) OnRunRecoveryCandidate(_ context.Context, run Run) error {
	h.candidates = append(h.candidates, run.ID)
	if h.failOnRun == run.ID {
		return errors.New("forced recovery failure")
	}
	return nil
}

func (h *captureRecoveryHooks) OnRunRecoveryFailed(_ context.Context, run Run, _ error) {
	h.failures = append(h.failures, run.ID)
}

func TestLifecycleAndDurableAckPersistence(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	svc := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
	})

	ctx := context.Background()
	lane, err := svc.CreateLane(ctx, CreateLaneInput{IssueID: "ISSUE-1", TopicID: "TOPIC-1"})
	if err != nil {
		t.Fatalf("create lane: %v", err)
	}

	run, err := svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		t.Fatalf("enqueue run: %v", err)
	}

	if _, err := svc.DispatchRun(ctx, run.ID, "runtime-dev"); err != nil {
		t.Fatalf("dispatch run: %v", err)
	}
	if _, err := svc.MarkRunRunning(ctx, run.ID); err != nil {
		t.Fatalf("mark running: %v", err)
	}
	if _, err := svc.RequireApproval(ctx, run.ID, "needs human approval"); err != nil {
		t.Fatalf("require approval: %v", err)
	}
	if _, err := svc.ResumeFromApproval(ctx, run.ID, "alice"); err != nil {
		t.Fatalf("resume approval: %v", err)
	}
	if _, err := svc.CompleteRun(ctx, run.ID, "done"); err != nil {
		t.Fatalf("complete run: %v", err)
	}

	events, err := svc.ListRunEvents(run.ID)
	if err != nil {
		t.Fatalf("list events: %v", err)
	}
	if len(events) < 6 {
		t.Fatalf("expected lifecycle events, got %d", len(events))
	}

	latest := events[len(events)-1].Sequence
	if _, err := svc.AckRun(ctx, run.ID, latest); err != nil {
		t.Fatalf("ack run: %v", err)
	}

	restarted := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
	})

	reloadedRun, err := restarted.GetRun(run.ID)
	if err != nil {
		t.Fatalf("get run after restart: %v", err)
	}
	if reloadedRun.AckedSequence != latest {
		t.Fatalf("acked sequence not persisted, expected %d got %d", latest, reloadedRun.AckedSequence)
	}

	expectedRunPath := filepath.Join(root, "worktrees", "lanes", lane.ID, "runs", run.ID)
	if _, err := os.Stat(expectedRunPath); err != nil {
		t.Fatalf("expected run path to exist: %v", err)
	}
}

func TestRecoverInterruptedRunBlocksInFlight(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	hooks := &captureRecoveryHooks{}
	svc := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
		Hooks:        hooks,
	})

	ctx := context.Background()
	lane, err := svc.CreateLane(ctx, CreateLaneInput{IssueID: "ISSUE-2", TopicID: "TOPIC-2"})
	if err != nil {
		t.Fatalf("create lane: %v", err)
	}
	run, err := svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		t.Fatalf("enqueue run: %v", err)
	}
	if _, err := svc.DispatchRun(ctx, run.ID, "runtime-01"); err != nil {
		t.Fatalf("dispatch run: %v", err)
	}
	if _, err := svc.MarkRunRunning(ctx, run.ID); err != nil {
		t.Fatalf("mark running: %v", err)
	}

	if err := svc.RecoverInterruptedRuns(ctx); err != nil {
		t.Fatalf("recover interrupted runs: %v", err)
	}

	recovered, err := svc.GetRun(run.ID)
	if err != nil {
		t.Fatalf("get recovered run: %v", err)
	}
	if recovered.State != RunStateBlocked {
		t.Fatalf("expected blocked run after recovery, got %s", recovered.State)
	}
	if !recovered.RecoveryNeeded {
		t.Fatalf("expected recovery_needed=true")
	}
	if len(hooks.candidates) != 1 || hooks.candidates[0] != run.ID {
		t.Fatalf("unexpected recovery candidates: %#v", hooks.candidates)
	}
}

func TestRecoverInterruptedRunFailsWhenHookFails(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	hooks := &captureRecoveryHooks{}
	svc := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
		Hooks:        hooks,
	})

	ctx := context.Background()
	lane, err := svc.CreateLane(ctx, CreateLaneInput{IssueID: "ISSUE-3", TopicID: "TOPIC-3"})
	if err != nil {
		t.Fatalf("create lane: %v", err)
	}
	run, err := svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		t.Fatalf("enqueue run: %v", err)
	}
	if _, err := svc.DispatchRun(ctx, run.ID, "runtime-01"); err != nil {
		t.Fatalf("dispatch run: %v", err)
	}

	hooks.failOnRun = run.ID
	if err := svc.RecoverInterruptedRuns(ctx); err != nil {
		t.Fatalf("recover interrupted runs: %v", err)
	}

	failed, err := svc.GetRun(run.ID)
	if err != nil {
		t.Fatalf("get failed run: %v", err)
	}
	if failed.State != RunStateFailed {
		t.Fatalf("expected failed run after hook failure, got %s", failed.State)
	}
	if !strings.Contains(failed.LastError, "forced recovery failure") {
		t.Fatalf("expected recovery failure cause in last_error, got %q", failed.LastError)
	}
	if len(hooks.failures) != 1 || hooks.failures[0] != run.ID {
		t.Fatalf("expected recovery failed callback, got %#v", hooks.failures)
	}
}

func TestExecutionFeedbackIngestionAndApprovalHoldLifecycle(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	svc := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
	})

	ctx := context.Background()
	lane, err := svc.CreateLane(ctx, CreateLaneInput{IssueID: "ISSUE-5", TopicID: "TOPIC-5"})
	if err != nil {
		t.Fatalf("create lane: %v", err)
	}
	run, err := svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		t.Fatalf("enqueue run: %v", err)
	}
	if _, err := svc.DispatchRun(ctx, run.ID, "runtime-01"); err != nil {
		t.Fatalf("dispatch run: %v", err)
	}
	if _, err := svc.MarkRunRunning(ctx, run.ID); err != nil {
		t.Fatalf("mark running: %v", err)
	}

	feedback, hold, updatedRun, err := svc.IngestExecutionFeedback(ctx, run.ID, ExecutionFeedbackInput{
		Source:          "runtime",
		Kind:            "tool_error",
		Severity:        "warning",
		Message:         "tool exited with retryable failure",
		RequestApproval: true,
		ApprovalReason:  "needs manual validation before retry",
	})
	if err != nil {
		t.Fatalf("ingest feedback: %v", err)
	}
	if feedback.ID == "" {
		t.Fatalf("feedback id should not be empty")
	}
	if hold == nil {
		t.Fatalf("expected approval hold from feedback ingestion")
	}
	if updatedRun.State != RunStateApprovalRequired {
		t.Fatalf("expected run in approval_required, got %s", updatedRun.State)
	}

	feedbacks, err := svc.ListExecutionFeedback(run.ID)
	if err != nil {
		t.Fatalf("list execution feedback: %v", err)
	}
	if len(feedbacks) != 1 {
		t.Fatalf("expected 1 feedback item, got %d", len(feedbacks))
	}

	holds, err := svc.ListExecutionApprovalHolds(run.ID)
	if err != nil {
		t.Fatalf("list execution holds: %v", err)
	}
	if len(holds) != 1 || holds[0].State != ApprovalHoldStateActive {
		t.Fatalf("expected one active hold, got %#v", holds)
	}

	resolvedHold, resumedRun, err := svc.ResolveExecutionApprovalHold(ctx, run.ID, hold.ID, ResolveExecutionApprovalHoldInput{
		Approved:       true,
		ResolvedBy:     "reviewer",
		ResolutionNote: "safe to continue",
	})
	if err != nil {
		t.Fatalf("resolve execution hold: %v", err)
	}
	if resolvedHold.State != ApprovalHoldStateReleased {
		t.Fatalf("expected released hold, got %s", resolvedHold.State)
	}
	if resumedRun.State != RunStateRunning {
		t.Fatalf("expected run resumed to running, got %s", resumedRun.State)
	}
}

func TestExecutionApprovalHoldRejectionBlocksRun(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	svc := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
	})

	ctx := context.Background()
	lane, err := svc.CreateLane(ctx, CreateLaneInput{IssueID: "ISSUE-6", TopicID: "TOPIC-6"})
	if err != nil {
		t.Fatalf("create lane: %v", err)
	}
	run, err := svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		t.Fatalf("enqueue run: %v", err)
	}
	if _, err := svc.DispatchRun(ctx, run.ID, "runtime-01"); err != nil {
		t.Fatalf("dispatch run: %v", err)
	}
	if _, err := svc.MarkRunRunning(ctx, run.ID); err != nil {
		t.Fatalf("mark running: %v", err)
	}

	hold, _, err := svc.RequestExecutionApprovalHold(ctx, run.ID, RequestExecutionApprovalHoldInput{
		Reason:      "dangerous command detected",
		RequestedBy: "runtime",
	})
	if err != nil {
		t.Fatalf("request execution hold: %v", err)
	}

	resolvedHold, blockedRun, err := svc.ResolveExecutionApprovalHold(ctx, run.ID, hold.ID, ResolveExecutionApprovalHoldInput{
		Approved:       false,
		ResolvedBy:     "reviewer",
		ResolutionNote: "command rejected",
	})
	if err != nil {
		t.Fatalf("reject execution hold: %v", err)
	}
	if resolvedHold.State != ApprovalHoldStateRejected {
		t.Fatalf("expected rejected hold, got %s", resolvedHold.State)
	}
	if blockedRun.State != RunStateBlocked {
		t.Fatalf("expected run blocked after rejection, got %s", blockedRun.State)
	}
	if !strings.Contains(blockedRun.LastError, "command rejected") {
		t.Fatalf("expected rejection reason in last_error, got %q", blockedRun.LastError)
	}
}

func TestInvalidTransitionIsRejected(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	svc := mustNewService(t, Config{
		StatePath:    filepath.Join(root, "state.json"),
		AckPath:      filepath.Join(root, "ack.json"),
		WorktreeRoot: filepath.Join(root, "worktrees"),
	})

	ctx := context.Background()
	lane, err := svc.CreateLane(ctx, CreateLaneInput{IssueID: "ISSUE-4", TopicID: "TOPIC-4"})
	if err != nil {
		t.Fatalf("create lane: %v", err)
	}
	run, err := svc.EnqueueRun(ctx, EnqueueRunInput{LaneID: lane.ID})
	if err != nil {
		t.Fatalf("enqueue run: %v", err)
	}

	if _, err := svc.MarkRunRunning(ctx, run.ID); err == nil {
		t.Fatalf("expected invalid transition error")
	} else if !errors.Is(err, errInvalidRunTransition) {
		t.Fatalf("expected errInvalidRunTransition, got %v", err)
	}
}

func mustNewService(t *testing.T, cfg Config) *Service {
	t.Helper()
	svc, err := NewService(cfg)
	if err != nil {
		t.Fatalf("new service: %v", err)
	}
	return svc
}
