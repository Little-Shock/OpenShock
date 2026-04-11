package main

import (
	"os"
	"path/filepath"
	"testing"

	"openshock/daemon/internal/client"
)

func TestParseAgentTurnReplyStructured(t *testing.T) {
	reply := parseAgentTurnReply("KIND: clarification_request\nBODY:\n请先确认是否允许我修改 billing 模块。")

	if reply.Kind != "clarification_request" {
		t.Fatalf("expected clarification_request kind, got %q", reply.Kind)
	}
	if reply.Body != "请先确认是否允许我修改 billing 模块。" {
		t.Fatalf("unexpected reply body: %q", reply.Body)
	}
}

func TestParseAgentTurnReplyStructuredNoResponse(t *testing.T) {
	reply := parseAgentTurnReply("KIND: no_response\nBODY:\n")

	if reply.Kind != "no_response" {
		t.Fatalf("expected no_response kind, got %q", reply.Kind)
	}
	if reply.Body != "" {
		t.Fatalf("expected empty body for no_response, got %q", reply.Body)
	}
}

func TestParseAgentTurnReplyFallsBackToMessage(t *testing.T) {
	reply := parseAgentTurnReply("我已理解目标。\n- 先检查上下文\n- 再给出计划")

	if reply.Kind != "message" {
		t.Fatalf("expected fallback kind message, got %q", reply.Kind)
	}
	if reply.Body == "" {
		t.Fatal("expected fallback body to preserve original content")
	}
}

func TestPrepareSessionCodexHomeCopiesProviderConfigAndAuth(t *testing.T) {
	base := t.TempDir()
	if err := os.WriteFile(filepath.Join(base, "config.toml"), []byte("model_provider = \"codex-for-me\"\n"), 0o600); err != nil {
		t.Fatalf("failed to seed config: %v", err)
	}
	if err := os.WriteFile(filepath.Join(base, "auth.json"), []byte("{\"token\":\"demo\"}\n"), 0o600); err != nil {
		t.Fatalf("failed to seed auth: %v", err)
	}

	target := prepareSessionCodexHome(base, client.AgentSession{
		ID:               "agent_session_123",
		ProviderThreadID: "provider_thread_agent_session_123",
	})
	if target == "" {
		t.Fatal("expected session codex home path")
	}

	for _, name := range []string{"config.toml", "auth.json"} {
		data, err := os.ReadFile(filepath.Join(target, name))
		if err != nil {
			t.Fatalf("expected %s to be copied: %v", name, err)
		}
		if len(data) == 0 {
			t.Fatalf("expected %s to be non-empty", name)
		}
	}
}
