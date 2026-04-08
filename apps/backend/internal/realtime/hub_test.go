package realtime

import "testing"

func TestHubPublishesToMatchingSubscribers(t *testing.T) {
	hub := NewHub(8)
	subscription := hub.Subscribe([]string{"issue:issue_101"}, 0)
	defer subscription.Close()

	hub.Publish("task.updated", []string{"workspace:ws_01", "issue:issue_101"}, map[string]any{
		"taskId": "task_guard",
	})

	select {
	case event := <-subscription.Events:
		if event.Type != "task.updated" {
			t.Fatalf("expected task.updated event, got %q", event.Type)
		}
		if event.Payload["taskId"] != "task_guard" {
			t.Fatalf("expected payload task_guard, got %#v", event.Payload)
		}
	default:
		t.Fatal("expected matching subscriber to receive event")
	}
}

func TestHubReplaysBufferedEventsAfterReconnect(t *testing.T) {
	hub := NewHub(8)
	first := hub.Publish("room.updated", []string{"workspace:ws_01"}, map[string]any{
		"messageId": "msg_101",
	})
	second := hub.Publish("task.updated", []string{"workspace:ws_01"}, map[string]any{
		"taskId": "task_guard",
	})

	subscription := hub.Subscribe([]string{"workspace:ws_01"}, first.Sequence)
	defer subscription.Close()

	if subscription.Resync {
		t.Fatal("expected buffered replay, got resync_required")
	}
	if len(subscription.Replay) != 1 {
		t.Fatalf("expected one replayed event, got %d", len(subscription.Replay))
	}
	if subscription.Replay[0].ID != second.ID {
		t.Fatalf("expected replay event %s, got %s", second.ID, subscription.Replay[0].ID)
	}
}

func TestHubMarksResyncWhenReplayGapExceeded(t *testing.T) {
	hub := NewHub(2)
	hub.Publish("room.updated", []string{"workspace:ws_01"}, nil)
	hub.Publish("task.updated", []string{"workspace:ws_01"}, nil)
	hub.Publish("run.updated", []string{"workspace:ws_01"}, nil)
	hub.Publish("merge.updated", []string{"workspace:ws_01"}, nil)

	subscription := hub.Subscribe([]string{"workspace:ws_01"}, 1)
	defer subscription.Close()

	if !subscription.Resync {
		t.Fatal("expected resync_required when replay window is exceeded")
	}
	if len(subscription.Replay) != 0 {
		t.Fatalf("expected no replay when resync is required, got %d events", len(subscription.Replay))
	}
}
