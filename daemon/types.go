package daemon

import (
	"errors"
	"fmt"
	"maps"
	"time"
)

// RunState mirrors the Phase 0 run state machine in PRD.
type RunState string

const (
	RunStateQueued           RunState = "queued"
	RunStateDispatched       RunState = "dispatched"
	RunStateRunning          RunState = "running"
	RunStateApprovalRequired RunState = "approval_required"
	RunStateCompleted        RunState = "completed"
	RunStateFailed           RunState = "failed"
	RunStateBlocked          RunState = "blocked"
	RunStateCancelled        RunState = "cancelled"
)

var errInvalidRunTransition = errors.New("invalid run state transition")

func (s RunState) IsTerminal() bool {
	switch s {
	case RunStateCompleted, RunStateFailed, RunStateBlocked, RunStateCancelled:
		return true
	default:
		return false
	}
}

func validateRunTransition(from, to RunState) error {
	if from == to {
		return nil
	}

	allowed := map[RunState]map[RunState]bool{
		RunStateQueued: {
			RunStateDispatched: true,
			RunStateCancelled:  true,
		},
		RunStateDispatched: {
			RunStateRunning:   true,
			RunStateFailed:    true,
			RunStateBlocked:   true,
			RunStateCancelled: true,
		},
		RunStateRunning: {
			RunStateApprovalRequired: true,
			RunStateCompleted:        true,
			RunStateFailed:           true,
			RunStateBlocked:          true,
			RunStateCancelled:        true,
		},
		RunStateApprovalRequired: {
			RunStateRunning:   true,
			RunStateFailed:    true,
			RunStateBlocked:   true,
			RunStateCancelled: true,
		},
		RunStateCompleted: {},
		RunStateFailed:    {},
		RunStateBlocked: {
			RunStateDispatched: true,
			RunStateCancelled:  true,
		},
		RunStateCancelled: {},
	}

	if !allowed[from][to] {
		return fmt.Errorf("%w: %s -> %s", errInvalidRunTransition, from, to)
	}
	return nil
}

type Lane struct {
	ID           string            `json:"id"`
	IssueID      string            `json:"issue_id"`
	TopicID      string            `json:"topic_id"`
	Branch       string            `json:"branch"`
	WorktreePath string            `json:"worktree_path"`
	Metadata     map[string]string `json:"metadata,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

type Run struct {
	ID             string            `json:"id"`
	LaneID         string            `json:"lane_id"`
	SessionID      string            `json:"session_id"`
	RuntimeID      string            `json:"runtime_id,omitempty"`
	State          RunState          `json:"state"`
	Sequence       uint64            `json:"sequence"`
	AckedSequence  uint64            `json:"acked_sequence"`
	LastError      string            `json:"last_error,omitempty"`
	Metadata       map[string]string `json:"metadata,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
	StartedAt      *time.Time        `json:"started_at,omitempty"`
	FinishedAt     *time.Time        `json:"finished_at,omitempty"`
	RecoveryNeeded bool              `json:"recovery_needed"`
}

type RunEvent struct {
	Sequence  uint64            `json:"sequence"`
	RunID     string            `json:"run_id"`
	Type      string            `json:"type"`
	State     RunState          `json:"state"`
	Message   string            `json:"message"`
	Metadata  map[string]string `json:"metadata,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
}

type ExecutionFeedback struct {
	ID        string            `json:"id"`
	RunID     string            `json:"run_id"`
	Source    string            `json:"source"`
	Kind      string            `json:"kind"`
	Severity  string            `json:"severity"`
	Message   string            `json:"message"`
	Metadata  map[string]string `json:"metadata,omitempty"`
	CreatedAt time.Time         `json:"created_at"`
}

type ApprovalHoldState string

const (
	ApprovalHoldStateActive   ApprovalHoldState = "active"
	ApprovalHoldStateReleased ApprovalHoldState = "released"
	ApprovalHoldStateRejected ApprovalHoldState = "rejected"
)

type ExecutionApprovalHold struct {
	ID             string            `json:"id"`
	RunID          string            `json:"run_id"`
	State          ApprovalHoldState `json:"state"`
	Reason         string            `json:"reason"`
	RequestedBy    string            `json:"requested_by"`
	ResolvedBy     string            `json:"resolved_by,omitempty"`
	ResolutionNote string            `json:"resolution_note,omitempty"`
	Metadata       map[string]string `json:"metadata,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
	ResolvedAt     *time.Time        `json:"resolved_at,omitempty"`
}

type Snapshot struct {
	Version   int                                `json:"version"`
	Lanes     map[string]Lane                    `json:"lanes"`
	Runs      map[string]Run                     `json:"runs"`
	Events    map[string][]RunEvent              `json:"events"`
	Feedbacks map[string][]ExecutionFeedback     `json:"feedbacks"`
	Holds     map[string][]ExecutionApprovalHold `json:"holds"`
}

func NewSnapshot() Snapshot {
	return Snapshot{
		Version:   1,
		Lanes:     map[string]Lane{},
		Runs:      map[string]Run{},
		Events:    map[string][]RunEvent{},
		Feedbacks: map[string][]ExecutionFeedback{},
		Holds:     map[string][]ExecutionApprovalHold{},
	}
}

func (s Snapshot) clone() Snapshot {
	clone := NewSnapshot()
	clone.Version = s.Version

	for id, lane := range s.Lanes {
		lane.Metadata = maps.Clone(lane.Metadata)
		clone.Lanes[id] = lane
	}

	for id, run := range s.Runs {
		run.Metadata = maps.Clone(run.Metadata)
		clone.Runs[id] = run
	}

	for id, events := range s.Events {
		copied := make([]RunEvent, 0, len(events))
		for _, event := range events {
			event.Metadata = maps.Clone(event.Metadata)
			copied = append(copied, event)
		}
		clone.Events[id] = copied
	}

	for id, feedbacks := range s.Feedbacks {
		copied := make([]ExecutionFeedback, 0, len(feedbacks))
		for _, feedback := range feedbacks {
			feedback.Metadata = maps.Clone(feedback.Metadata)
			copied = append(copied, feedback)
		}
		clone.Feedbacks[id] = copied
	}

	for id, holds := range s.Holds {
		copied := make([]ExecutionApprovalHold, 0, len(holds))
		for _, hold := range holds {
			hold.Metadata = maps.Clone(hold.Metadata)
			copied = append(copied, hold)
		}
		clone.Holds[id] = copied
	}

	return clone
}
