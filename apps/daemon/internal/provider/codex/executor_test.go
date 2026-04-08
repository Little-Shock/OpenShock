package codex

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"openshock/daemon/internal/acp"
)

func TestExecuteWritesLastMessageAndRepoArtifact(t *testing.T) {
	repoPath := t.TempDir()
	binPath := writeFakeCodexBinary(t)

	var events []acp.Event

	result, err := NewExecutor().Execute(context.Background(), ExecuteRequest{
		RepoPath:     repoPath,
		Instruction:  "Create a proof artifact",
		CodexBinPath: binPath,
	}, func(event acp.Event) error {
		events = append(events, event)
		return nil
	})
	if err != nil {
		t.Fatalf("execute returned error: %v", err)
	}
	if strings.TrimSpace(result.LastMessage) != "fake codex completed task" {
		t.Fatalf("unexpected last message: %q", result.LastMessage)
	}

	artifactBytes, err := os.ReadFile(filepath.Join(repoPath, "agent-output.txt"))
	if err != nil {
		t.Fatalf("failed to read agent artifact: %v", err)
	}
	if strings.TrimSpace(string(artifactBytes)) != "Create a proof artifact" {
		t.Fatalf("unexpected agent artifact content: %q", string(artifactBytes))
	}
	if _, err := os.Stat(filepath.Join(repoPath, ".openshock_codex_last_message.txt")); !os.IsNotExist(err) {
		t.Fatalf("expected temporary last message file to be removed, got err=%v", err)
	}
	if len(events) < 3 {
		t.Fatalf("expected ACP events to be emitted, got %#v", events)
	}
	toolCallFound := false
	shellCommandFound := false
	for _, event := range events {
		if event.Kind == acp.EventToolCall && event.ToolCall != nil && event.ToolCall.ToolName == "openshock" {
			toolCallFound = true
		}
		if event.Kind == acp.EventToolCall && event.ToolCall != nil && event.ToolCall.ToolName == "shell" && strings.Contains(event.ToolCall.Arguments, "openshock task create") {
			shellCommandFound = true
		}
	}
	if !toolCallFound {
		t.Fatalf("expected tool call event, got %#v", events)
	}
	if !shellCommandFound {
		t.Fatalf("expected command execution event to normalize into shell tool call, got %#v", events)
	}
}

func writeFakeCodexBinary(t *testing.T) string {
	t.Helper()

	dir := t.TempDir()
	path := filepath.Join(dir, "codex")
	content := `#!/bin/sh
output_file=""
repo_path=""
instruction=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    exec)
      shift
      ;;
    --json)
      shift
      ;;
    -o)
      output_file="$2"
      shift 2
      ;;
    -C)
      repo_path="$2"
      shift 2
      ;;
    *)
      instruction="$1"
      shift
      ;;
  esac
done
printf '%s\n' '{"type":"thread.started","thread_id":"thread_fake"}'
printf '%s\n' '{"type":"turn.started"}'
printf '%s\n' '{"type":"response.output_text.delta","delta":"fake codex streamed stdout"}'
printf '%s\n' '{"type":"item.started","item":{"id":"cmd_01","type":"command_execution","command":"openshock task create","status":"in_progress"}}'
printf '%s\n' '{"type":"item.completed","item":{"id":"cmd_01","type":"command_execution","command":"openshock task create","status":"completed","aggregated_output":"task created"}}'
printf '%s\n' '{"type":"response.output_item.done","item":{"id":"fn_01","type":"function_call","name":"openshock","arguments":"{\"command\":\"task create\"}","status":"completed"}}'
printf '%s\n' "fake codex completed task" > "$output_file"
printf '%s\n' "$instruction" > "$repo_path/agent-output.txt"
`
	if err := os.WriteFile(path, []byte(content), 0o755); err != nil {
		t.Fatalf("failed to write fake codex binary: %v", err)
	}
	return path
}
