package store

import (
	"path/filepath"
	"testing"
)

func TestAppendConversationAsAgentPersistsReplyTargetForRoomThreadTruth(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	nextState, err := s.AppendConversationAsAgent(
		"room-runtime",
		"回复 Codex Dockmaster：继续这条线程。",
		"Codex Dockmaster",
		"收到，我继续沿这条线程推进。",
		"codex",
		"msg-room-1",
	)
	if err != nil {
		t.Fatalf("AppendConversationAsAgent() error = %v", err)
	}

	messages := nextState.RoomMessages["room-runtime"]
	if len(messages) < 2 {
		t.Fatalf("room messages = %#v, want appended human + agent reply", messages)
	}
	human := messages[len(messages)-2]
	agent := messages[len(messages)-1]
	if human.ReplyToMessageID != "msg-room-1" || agent.ReplyToMessageID != "msg-room-1" {
		t.Fatalf("room thread truth = human %#v agent %#v, want replyTo msg-room-1", human, agent)
	}
}

func TestMarkRoomConversationPendingAndInterruptedKeepReplyTarget(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	pendingState, err := s.MarkRoomConversationPending("room-runtime", "继续这条线程。", "codex", "msg-room-2")
	if err != nil {
		t.Fatalf("MarkRoomConversationPending() error = %v", err)
	}
	pending := findRoomSession(pendingState, "room-runtime")
	if pending == nil || pending.PendingTurn == nil {
		t.Fatalf("pending session = %#v, want pending turn", pending)
	}
	if pending.PendingTurn.ReplyToMessageID != "msg-room-2" {
		t.Fatalf("pending turn = %#v, want replyTo msg-room-2", pending.PendingTurn)
	}

	interruptedState, err := s.MarkRoomConversationInterrupted("room-runtime", "继续这条线程。", "codex", "已做第一段检查。", "msg-room-2")
	if err != nil {
		t.Fatalf("MarkRoomConversationInterrupted() error = %v", err)
	}
	interrupted := findRoomSession(interruptedState, "room-runtime")
	if interrupted == nil || interrupted.PendingTurn == nil {
		t.Fatalf("interrupted session = %#v, want pending turn", interrupted)
	}
	if interrupted.PendingTurn.ReplyToMessageID != "msg-room-2" {
		t.Fatalf("interrupted pending turn = %#v, want replyTo msg-room-2", interrupted.PendingTurn)
	}
}

func findRoomSession(state State, roomID string) *Session {
	var fallback *Session
	for index := range state.Sessions {
		if state.Sessions[index].RoomID == roomID {
			if state.Sessions[index].PendingTurn != nil {
				return &state.Sessions[index]
			}
			if fallback == nil || state.Sessions[index].Status != "done" {
				fallback = &state.Sessions[index]
			}
		}
	}
	if fallback != nil {
		return fallback
	}
	for index := range state.Sessions {
		if state.Sessions[index].RoomID == roomID {
			return &state.Sessions[index]
		}
	}
	return nil
}
