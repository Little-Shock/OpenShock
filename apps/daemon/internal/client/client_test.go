package client

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRegisterRuntime(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/runtimes/register" {
			t.Fatalf("unexpected path %q", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"runtime":{"id":"rt_201","name":"Daemon Runner","status":"online","provider":"codex"}}`))
	}))
	defer server.Close()

	client := New(server.URL)
	resp, err := client.RegisterRuntime(context.Background(), RegisterRuntimeRequest{
		Name: "Daemon Runner", Provider: "codex", SlotCount: 2,
	})
	if err != nil {
		t.Fatalf("register returned error: %v", err)
	}
	if resp.Runtime.ID != "rt_201" {
		t.Fatalf("expected runtime id rt_201, got %q", resp.Runtime.ID)
	}
}

func TestSubmitAction(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/actions" {
			t.Fatalf("unexpected path %q", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"actionId":"action_301","status":"completed","resultCode":"task_created","resultMessage":"Task created.","affectedEntities":[{"type":"task","id":"task_301"}]}`))
	}))
	defer server.Close()

	client := New(server.URL)
	resp, err := client.SubmitAction(context.Background(), ActionRequest{
		ActorType:      "agent",
		ActorID:        "agent_lead",
		ActionType:     "Task.create",
		TargetType:     "issue",
		TargetID:       "issue_101",
		Payload:        map[string]any{"title": "Write test"},
		IdempotencyKey: "task-create-301",
	})
	if err != nil {
		t.Fatalf("submit action returned error: %v", err)
	}
	if resp.ActionID != "action_301" {
		t.Fatalf("expected action id action_301, got %q", resp.ActionID)
	}
}

func TestClaimRun(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/runs/claim" {
			t.Fatalf("unexpected path %q", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"claimed":true,"run":{"id":"run_201","taskId":"task_201","agentId":"agent_201","runtimeId":"rt_201","status":"running","title":"test","outputPreview":"claimed"}}`))
	}))
	defer server.Close()

	client := New(server.URL)
	resp, err := client.ClaimRun(context.Background(), "rt_201")
	if err != nil {
		t.Fatalf("claim returned error: %v", err)
	}
	if !resp.Claimed || resp.Run == nil || resp.Run.ID != "run_201" {
		t.Fatalf("unexpected claim response: %#v", resp)
	}
}

func TestClaimAgentTurn(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/agent-turns/claim" {
			t.Fatalf("unexpected path %q", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"claimed":true,"agentTurn":{"turn":{"id":"turn_201","sessionId":"agent_session_201","roomId":"room_001","agentId":"agent_shell","sequence":1,"triggerMessageId":"msg_201","intentType":"visible_message_response","status":"claimed","createdAt":"2026-04-06T00:00:00Z"},"room":{"id":"room_001","kind":"discussion","title":"Announcements"},"agentName":"Shell_Runner","instruction":"server-built prompt","triggerMessage":{"id":"msg_201","actorType":"member","actorName":"Sarah","body":"@agent_shell please reply","kind":"message","createdAt":"2026-04-06T00:00:00Z"},"messages":[]}}`))
	}))
	defer server.Close()

	client := New(server.URL)
	resp, err := client.ClaimAgentTurn(context.Background(), "rt_201")
	if err != nil {
		t.Fatalf("claim agent turn returned error: %v", err)
	}
	if !resp.Claimed || resp.AgentTurn == nil || resp.AgentTurn.Turn.ID != "turn_201" {
		t.Fatalf("unexpected agent turn claim response: %#v", resp)
	}
	if resp.AgentTurn.AgentName != "Shell_Runner" {
		t.Fatalf("expected agent display name Shell_Runner, got %#v", resp.AgentTurn)
	}
	if resp.AgentTurn.Instruction != "server-built prompt" {
		t.Fatalf("expected server-built instruction, got %#v", resp.AgentTurn)
	}
}

func TestClaimMerge(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/merges/claim" {
			t.Fatalf("unexpected path %q", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"claimed":true,"mergeAttempt":{"id":"merge_201","issueId":"issue_201","taskId":"task_201","sourceBranch":"issue-201/task-201","targetBranch":"issue-201/integration","status":"running","runtimeId":"rt_201","resultSummary":"started"}}`))
	}))
	defer server.Close()

	client := New(server.URL)
	resp, err := client.ClaimMerge(context.Background(), "rt_201")
	if err != nil {
		t.Fatalf("claim merge returned error: %v", err)
	}
	if !resp.Claimed || resp.MergeAttempt == nil || resp.MergeAttempt.ID != "merge_201" {
		t.Fatalf("unexpected merge claim response: %#v", resp)
	}
}

func TestClaimAgentTurnReturnsHTTPStatusError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := New(server.URL)
	_, err := client.ClaimAgentTurn(context.Background(), "rt_201")
	if err == nil {
		t.Fatal("expected claim agent turn to return an error")
	}

	var statusErr *HTTPStatusError
	if !errors.As(err, &statusErr) {
		t.Fatalf("expected HTTPStatusError, got %T", err)
	}
	if statusErr.StatusCode != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", statusErr.StatusCode)
	}
	if !IsHTTPStatus(err, http.StatusNotFound) {
		t.Fatal("expected IsHTTPStatus to detect 404 error")
	}
}
