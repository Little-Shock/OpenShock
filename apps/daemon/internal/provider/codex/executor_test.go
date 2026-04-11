package codex

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"openshock/daemon/internal/acp"
	"openshock/daemon/internal/provider"
)

func TestExecuteWritesLastMessageAndRepoArtifact(t *testing.T) {
	repoPath := t.TempDir()
	binPath := writeFakeCodexBinary(t)

	var events []acp.Event

	result, err := NewExecutor().Execute(context.Background(), provider.ExecuteRequest{
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
	sessionMessageFound := false
	toolCallFound := false
	shellCommandFound := false
	for _, event := range events {
		if event.Kind == acp.EventStdoutChunk && event.Stream == "session" && strings.Contains(event.Content, "checking the current directory") {
			sessionMessageFound = true
		}
		if event.Kind == acp.EventToolCall && event.ToolCall != nil && event.ToolCall.ToolName == "openshock" {
			toolCallFound = true
		}
		if event.Kind == acp.EventToolCall && event.ToolCall != nil && event.ToolCall.ToolName == "shell" && strings.Contains(event.ToolCall.Arguments, "openshock task create") {
			shellCommandFound = true
		}
		if strings.Contains(event.Content, "Reading additional input from stdin") {
			t.Fatalf("expected executor to ignore codex cli noise, got %#v", events)
		}
	}
	if !sessionMessageFound {
		t.Fatalf("expected session agent_message event, got %#v", events)
	}
	if !toolCallFound {
		t.Fatalf("expected tool call event, got %#v", events)
	}
	if !shellCommandFound {
		t.Fatalf("expected command execution event to normalize into shell tool call, got %#v", events)
	}
}

func TestExecuteUsesConfiguredSandboxMode(t *testing.T) {
	repoPath := t.TempDir()
	binPath := writeSandboxCapturingCodexBinary(t)
	sandboxLogPath := filepath.Join(repoPath, "sandbox-args.txt")

	_, err := NewExecutor().Execute(context.Background(), provider.ExecuteRequest{
		RepoPath:     repoPath,
		Instruction:  "Inspect sandbox args",
		CodexBinPath: binPath,
		SandboxMode:  "workspace-write",
	}, nil)
	if err != nil {
		t.Fatalf("execute returned error: %v", err)
	}

	argsBytes, err := os.ReadFile(sandboxLogPath)
	if err != nil {
		t.Fatalf("failed to read sandbox args log: %v", err)
	}
	if !strings.Contains(string(argsBytes), "--sandbox workspace-write") {
		t.Fatalf("expected executor to pass configured sandbox mode, got %q", string(argsBytes))
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
printf '%s\n' "Reading additional input from stdin..."
printf '%s\n' '{"type":"turn.started"}'
printf '%s\n' '{"type":"item.completed","item":{"id":"msg_01","type":"agent_message","text":"checking the current directory before I run the task"}}'
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

func writeSandboxCapturingCodexBinary(t *testing.T) string {
	t.Helper()

	dir := t.TempDir()
	path := filepath.Join(dir, "codex")
	content := `#!/bin/sh
repo_path=""
output_file=""
all_args="$*"
while [ "$#" -gt 0 ]; do
  case "$1" in
    -C)
      repo_path="$2"
      shift 2
      ;;
    -o)
      output_file="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
printf '%s\n' "$all_args" > "$repo_path/sandbox-args.txt"
printf '%s\n' "sandbox captured" > "$output_file"
`
	if err := os.WriteFile(path, []byte(content), 0o755); err != nil {
		t.Fatalf("failed to write sandbox capturing codex binary: %v", err)
	}
	return path
}
