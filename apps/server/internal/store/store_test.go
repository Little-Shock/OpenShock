package store

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCreateIssueInitializesSessionMemoryPaths(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	result, err := s.CreateIssue(CreateIssueInput{
		Title:    "Session Memory Ready",
		Summary:  "verify session memory paths",
		Owner:    "Claude Review Runner",
		Priority: "high",
	})
	if err != nil {
		t.Fatalf("CreateIssue() error = %v", err)
	}

	if _, err := s.AttachLane(result.RunID, result.SessionID, LaneBinding{
		Branch:       result.Branch,
		WorktreeName: result.WorktreeName,
		Path:         filepath.Join(root, ".openshock-worktrees", result.WorktreeName),
	}); err != nil {
		t.Fatalf("AttachLane() error = %v", err)
	}

	snapshot := s.Snapshot()
	session := findSessionByID(snapshot, result.SessionID)
	if session == nil {
		t.Fatalf("session %q not found", result.SessionID)
	}

	if len(session.MemoryPaths) != 4 {
		t.Fatalf("expected 4 session memory paths, got %d: %#v", len(session.MemoryPaths), session.MemoryPaths)
	}

	want := []string{
		"MEMORY.md",
		"notes/work-log.md",
		filepath.ToSlash(filepath.Join("notes", "rooms", "room-session-memory-ready.md")),
		filepath.ToSlash(filepath.Join("decisions", "ops-28.md")),
	}
	for _, path := range want {
		if !contains(session.MemoryPaths, path) {
			t.Fatalf("expected session memory paths to contain %q, got %#v", path, session.MemoryPaths)
		}
	}
}

func TestPullRequestStatusUpdatesDecisionCurrentAndRoomSummary(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	result, err := s.CreateIssue(CreateIssueInput{
		Title:    "Merged Summary Sync",
		Summary:  "verify merged state writeback",
		Owner:    "Claude Review Runner",
		Priority: "critical",
	})
	if err != nil {
		t.Fatalf("CreateIssue() error = %v", err)
	}

	if _, err := s.AttachLane(result.RunID, result.SessionID, LaneBinding{
		Branch:       result.Branch,
		WorktreeName: result.WorktreeName,
		Path:         filepath.Join(root, ".openshock-worktrees", result.WorktreeName),
	}); err != nil {
		t.Fatalf("AttachLane() error = %v", err)
	}

	if _, _, err := s.CreatePullRequest(result.RoomID); err != nil {
		t.Fatalf("CreatePullRequest() error = %v", err)
	}

	snapshot := s.Snapshot()
	pr := findPullRequestByRoom(snapshot, result.RoomID)
	if pr == nil {
		t.Fatalf("pull request for room %q not found", result.RoomID)
	}

	if _, err := s.UpdatePullRequestStatus(pr.ID, "merged"); err != nil {
		t.Fatalf("UpdatePullRequestStatus() error = %v", err)
	}

	merged := s.Snapshot()
	room := findRoomByID(merged, result.RoomID)
	run := findRunByID(merged, result.RunID)
	session := findSessionByID(merged, result.SessionID)

	if room == nil || run == nil || session == nil {
		t.Fatalf("expected room/run/session to exist after merge")
	}

	wantSummary := "PR 已合并，Issue 与讨论间进入完成状态。"
	if room.Topic.Summary != wantSummary {
		t.Fatalf("room topic summary = %q, want %q", room.Topic.Summary, wantSummary)
	}
	if run.Summary != wantSummary {
		t.Fatalf("run summary = %q, want %q", run.Summary, wantSummary)
	}
	if session.Summary != wantSummary {
		t.Fatalf("session summary = %q, want %q", session.Summary, wantSummary)
	}

	decisionPath := filepath.Join(root, "decisions", "ops-28.md")
	body, err := os.ReadFile(decisionPath)
	if err != nil {
		t.Fatalf("ReadFile(%q) error = %v", decisionPath, err)
	}
	content := string(body)
	if !strings.Contains(content, "- Current: merged") {
		t.Fatalf("decision file missing merged current status:\n%s", content)
	}
}

func contains(items []string, want string) bool {
	for _, item := range items {
		if item == want {
			return true
		}
	}
	return false
}

func findSessionByID(state State, sessionID string) *Session {
	for index := range state.Sessions {
		if state.Sessions[index].ID == sessionID {
			return &state.Sessions[index]
		}
	}
	return nil
}

func findRoomByID(state State, roomID string) *Room {
	for index := range state.Rooms {
		if state.Rooms[index].ID == roomID {
			return &state.Rooms[index]
		}
	}
	return nil
}

func findRunByID(state State, runID string) *Run {
	for index := range state.Runs {
		if state.Runs[index].ID == runID {
			return &state.Runs[index]
		}
	}
	return nil
}

func findPullRequestByRoom(state State, roomID string) *PullRequest {
	for index := range state.PullRequests {
		if state.PullRequests[index].RoomID == roomID {
			return &state.PullRequests[index]
		}
	}
	return nil
}
