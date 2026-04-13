package store

import (
	"path/filepath"
	"testing"
	"time"
)

func TestSubscribeStateReplaysUpdatesAfterSequence(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	if _, _, _, err := s.UpdateNotificationPolicy(NotificationPolicyInput{BrowserPush: "all"}); err != nil {
		t.Fatalf("UpdateNotificationPolicy() error = %v", err)
	}
	if _, err := s.UpsertRuntimeHeartbeat(RuntimeHeartbeatInput{
		RuntimeID:          "shock-replay",
		DaemonURL:          "http://127.0.0.1:8092",
		Machine:            "shock-replay",
		DetectedCLI:        []string{"codex"},
		State:              "online",
		WorkspaceRoot:      root,
		ReportedAt:         time.Now().UTC().Format(time.RFC3339),
		HeartbeatIntervalS: 12,
		HeartbeatTimeoutS:  48,
	}); err != nil {
		t.Fatalf("UpsertRuntimeHeartbeat() error = %v", err)
	}

	subscription := s.SubscribeState(1)
	defer s.UnsubscribeState(subscription.ID)

	if subscription.Resync {
		t.Fatalf("subscription = %#v, want replay without resync", subscription)
	}
	if len(subscription.Replay) != 2 {
		t.Fatalf("len(subscription.Replay) = %d, want 2", len(subscription.Replay))
	}
	if subscription.Replay[0].Sequence != 2 || subscription.Replay[1].Sequence != 3 {
		t.Fatalf("replay sequences = %#v, want [2 3]", subscription.Replay)
	}
	if subscription.Current.Sequence != 3 {
		t.Fatalf("current sequence = %d, want 3", subscription.Current.Sequence)
	}
}

func TestSubscribeStateRequestsResyncWhenHistoryFallsBehind(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	for index := 0; index < 260; index += 1 {
		if _, err := s.UpsertRuntimeHeartbeat(RuntimeHeartbeatInput{
			RuntimeID:          "shock-resync",
			DaemonURL:          "http://127.0.0.1:8093",
			Machine:            "shock-resync",
			DetectedCLI:        []string{"codex"},
			State:              "online",
			WorkspaceRoot:      root,
			ReportedAt:         time.Now().UTC().Add(time.Duration(index) * time.Second).Format(time.RFC3339),
			HeartbeatIntervalS: 12,
			HeartbeatTimeoutS:  48,
		}); err != nil {
			t.Fatalf("UpsertRuntimeHeartbeat(%d) error = %v", index, err)
		}
	}

	subscription := s.SubscribeState(1)
	defer s.UnsubscribeState(subscription.ID)

	if !subscription.Resync {
		t.Fatalf("subscription = %#v, want resync", subscription)
	}
	if len(subscription.Replay) != 0 {
		t.Fatalf("len(subscription.Replay) = %d, want 0 on resync", len(subscription.Replay))
	}
	if subscription.Current.Sequence <= defaultStateStreamHistoryCap {
		t.Fatalf("current sequence = %d, want beyond history cap", subscription.Current.Sequence)
	}
}

func TestSubscribeStateRequestsResyncWhenRequestedSequenceExceedsCurrentState(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	subscription := s.SubscribeState(99)
	defer s.UnsubscribeState(subscription.ID)

	if !subscription.Resync {
		t.Fatalf("subscription = %#v, want resync when requested sequence exceeds current state", subscription)
	}
	if len(subscription.Replay) != 0 {
		t.Fatalf("len(subscription.Replay) = %d, want 0 on resync", len(subscription.Replay))
	}
	if subscription.Current.Sequence != 1 {
		t.Fatalf("current sequence = %d, want 1", subscription.Current.Sequence)
	}
}
