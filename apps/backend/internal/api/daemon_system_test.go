package api

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"net/http/httptest"

	"openshock/backend/internal/store"
)

func TestDaemonOnceCompletesQueuedRun(t *testing.T) {
	backingStore := store.NewMemoryStore()
	repoPath := newGitFixtureRepo(t)
	if err := backingStore.BindWorkspaceRepo("ws_01", repoPath, "daemon-fixture", true); err != nil {
		t.Fatalf("bind workspace repo returned error: %v", err)
	}
	server := httptest.NewServer(New(backingStore).Handler())
	defer server.Close()

	daemonDir := daemonModuleDir(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	fakeCodex := writeFakeCodexBinary(t)

	cmd := exec.CommandContext(
		ctx,
		"go",
		"run",
		"./cmd/daemon",
		"--once",
		"--api-base-url",
		server.URL,
		"--name",
		"E2E Daemon",
	)
	cmd.Dir = daemonDir
	cmd.Env = append(os.Environ(), "OPENSHOCK_CODEX_BIN="+fakeCodex)

	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		t.Fatalf("daemon timed out: %s", string(output))
	}
	if err != nil {
		t.Fatalf("daemon command failed: %v\n%s", err, string(output))
	}

	detail, err := backingStore.IssueDetail("issue_101")
	if err != nil {
		t.Fatalf("issue detail returned error: %v", err)
	}

	runCompleted := false
	outputChunkRecorded := false
	toolCallRecorded := false
	for _, run := range detail.Runs {
		if run.ID == "run_review_01" && run.Status == "completed" {
			runCompleted = true
		}
	}
	for _, chunk := range detail.RunOutputChunks {
		if chunk.RunID == "run_review_01" {
			outputChunkRecorded = true
		}
	}
	for _, toolCall := range detail.ToolCalls {
		if toolCall.RunID == "run_review_01" {
			toolCallRecorded = true
		}
	}
	if !runCompleted {
		t.Fatalf("expected queued seed run to complete via daemon, got %#v\n\ndaemon output:\n%s", detail.Runs, string(output))
	}
	if !outputChunkRecorded {
		t.Fatalf("expected daemon run to append output chunks, got %#v\n\ndaemon output:\n%s", detail.RunOutputChunks, string(output))
	}
	if !toolCallRecorded {
		t.Fatalf("expected daemon run to append tool calls, got %#v\n\ndaemon output:\n%s", detail.ToolCalls, string(output))
	}
	artifactBytes, err := os.ReadFile(filepath.Join(repoPath, "agent-output.txt"))
	if err != nil {
		t.Fatalf("expected codex artifact to be written: %v", err)
	}
	if strings.TrimSpace(string(artifactBytes)) == "" {
		t.Fatal("expected codex artifact to contain instruction text")
	}
	currentBranch := mustGit(t, repoPath, "branch", "--show-current")
	if strings.TrimSpace(currentBranch) != "issue-101/task-review" {
		t.Fatalf("expected daemon to execute on task branch, got %q", currentBranch)
	}

	if len(detail.Messages) < 5 {
		t.Fatalf("expected daemon to append system messages, got %d messages", len(detail.Messages))
	}

	bootstrap := backingStore.Bootstrap()
	runtimeFound := false
	for _, runtime := range bootstrap.Runtimes {
		if runtime.Name == "E2E Daemon" {
			runtimeFound = true
		}
	}
	if !runtimeFound {
		t.Fatalf("expected daemon runtime registration, got %#v", bootstrap.Runtimes)
	}
}

func TestDaemonOnceCompletesQueuedMergeAttempt(t *testing.T) {
	backingStore := store.NewMemoryStore()
	repoPath := newGitFixtureRepo(t)
	setupMergeFixtureBranches(t, repoPath)
	if err := backingStore.BindWorkspaceRepo("ws_01", repoPath, "daemon-fixture", true); err != nil {
		t.Fatalf("bind workspace repo returned error: %v", err)
	}
	if _, err := backingStore.RequestMerge("task_guard"); err != nil {
		t.Fatalf("request merge returned error: %v", err)
	}
	if _, err := backingStore.ApproveMerge("task_guard", "Sarah"); err != nil {
		t.Fatalf("approve merge returned error: %v", err)
	}

	server := httptest.NewServer(New(backingStore).Handler())
	defer server.Close()

	daemonDir := daemonModuleDir(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	fakeCodex := writeFakeCodexBinary(t)

	cmd := exec.CommandContext(
		ctx,
		"go",
		"run",
		"./cmd/daemon",
		"--once",
		"--api-base-url",
		server.URL,
		"--name",
		"E2E Merge Daemon",
	)
	cmd.Dir = daemonDir
	cmd.Env = append(os.Environ(), "OPENSHOCK_CODEX_BIN="+fakeCodex)

	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		t.Fatalf("daemon timed out: %s", string(output))
	}
	if err != nil {
		t.Fatalf("daemon command failed: %v\n%s", err, string(output))
	}

	detail, err := backingStore.IssueDetail("issue_101")
	if err != nil {
		t.Fatalf("issue detail returned error: %v", err)
	}

	mergeSucceeded := false
	taskIntegrated := false
	for _, attempt := range detail.MergeAttempts {
		if attempt.TaskID == "task_guard" && attempt.Status == "succeeded" {
			mergeSucceeded = true
		}
	}
	for _, task := range detail.Tasks {
		if task.ID == "task_guard" && task.Status == "integrated" {
			taskIntegrated = true
		}
	}

	if !mergeSucceeded {
		t.Fatalf("expected merge attempt to complete via daemon, got %#v", detail.MergeAttempts)
	}
	if !taskIntegrated {
		t.Fatalf("expected merge success to integrate task, got %#v", detail.Tasks)
	}
}

func TestDaemonOnceCompletesQueuedAgentTurn(t *testing.T) {
	backingStore := store.NewMemoryStore()
	backingStore.PostRoomMessage("room_001", "member", "Sarah", "message", "@agent_shell 请先理解这个目标, 然后给我一个简短计划。")
	server := httptest.NewServer(New(backingStore).Handler())
	defer server.Close()

	daemonDir := daemonModuleDir(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	fakeCodex := writeFakeCodexBinary(t)

	cmd := exec.CommandContext(
		ctx,
		"go",
		"run",
		"./cmd/daemon",
		"--once",
		"--api-base-url",
		server.URL,
		"--name",
		"E2E Agent Turn Daemon",
	)
	cmd.Dir = daemonDir
	cmd.Env = append(os.Environ(), "OPENSHOCK_CODEX_BIN="+fakeCodex)

	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		t.Fatalf("daemon timed out: %s", string(output))
	}
	if err != nil {
		t.Fatalf("daemon command failed: %v\n%s", err, string(output))
	}

	detail, err := backingStore.RoomDetail("room_001")
	if err != nil {
		t.Fatalf("room detail returned error: %v", err)
	}
	if len(detail.AgentTurns) != 1 || detail.AgentTurns[0].Status != "completed" {
		t.Fatalf("expected completed agent turn, got %#v", detail.AgentTurns)
	}

	foundAgentReply := false
	for _, message := range detail.Messages {
		if message.ActorType == "agent" && message.ActorName == "agent_shell" {
			foundAgentReply = true
		}
	}
	if !foundAgentReply {
		t.Fatalf("expected daemon to post agent reply into room, got %#v", detail.Messages)
	}
}

func TestDaemonOnceCanCompleteQueuedAgentTurnWithoutPostingReply(t *testing.T) {
	backingStore := store.NewMemoryStore()
	backingStore.PostRoomMessage("room_001", "member", "Sarah", "message", "@agent_shell FYI，我刚把文档同步好了。")

	before, err := backingStore.RoomDetail("room_001")
	if err != nil {
		t.Fatalf("room detail before daemon returned error: %v", err)
	}
	beforeMessageCount := len(before.Messages)

	server := httptest.NewServer(New(backingStore).Handler())
	defer server.Close()

	daemonDir := daemonModuleDir(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	fakeCodex := writeFakeCodexBinaryWithFinalMessage(t, "KIND: no_response\nBODY:\n")

	cmd := exec.CommandContext(
		ctx,
		"go",
		"run",
		"./cmd/daemon",
		"--once",
		"--api-base-url",
		server.URL,
		"--name",
		"E2E Agent Turn No Reply Daemon",
	)
	cmd.Dir = daemonDir
	cmd.Env = append(os.Environ(), "OPENSHOCK_CODEX_BIN="+fakeCodex)

	output, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		t.Fatalf("daemon timed out: %s", string(output))
	}
	if err != nil {
		t.Fatalf("daemon command failed: %v\n%s", err, string(output))
	}

	detail, err := backingStore.RoomDetail("room_001")
	if err != nil {
		t.Fatalf("room detail returned error: %v", err)
	}
	if len(detail.AgentTurns) != 1 || detail.AgentTurns[0].Status != "completed" {
		t.Fatalf("expected completed agent turn, got %#v", detail.AgentTurns)
	}
	if len(detail.Messages) != beforeMessageCount {
		t.Fatalf("expected no additional room message for no_response, got before=%d after=%d %#v", beforeMessageCount, len(detail.Messages), detail.Messages)
	}
}

func setupMergeFixtureBranches(t *testing.T, repoPath string) {
	t.Helper()

	mustGit(t, repoPath, "checkout", "-b", "issue-101/integration")
	mustGit(t, repoPath, "checkout", "-b", "issue-101/task-guard")
	if err := os.WriteFile(filepath.Join(repoPath, "feature.txt"), []byte("task branch feature\n"), 0o644); err != nil {
		t.Fatalf("failed to write merge fixture file: %v", err)
	}
	mustGit(t, repoPath, "add", "feature.txt")
	mustGit(t, repoPath, "commit", "-m", "task branch feature")
	mustGit(t, repoPath, "checkout", "issue-101/integration")
}

func daemonModuleDir(t *testing.T) string {
	t.Helper()

	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("failed to get working directory: %v", err)
	}

	daemonDir := filepath.Clean(filepath.Join(wd, "../../../../apps/daemon"))
	if !strings.HasSuffix(daemonDir, filepath.Join("apps", "daemon")) {
		t.Fatalf("resolved daemon directory looks wrong: %s", daemonDir)
	}
	return daemonDir
}

func newGitFixtureRepo(t *testing.T) string {
	t.Helper()

	repoPath := t.TempDir()
	mustGit(t, repoPath, "init", "-b", "main")
	mustGit(t, repoPath, "config", "user.name", "OpenShock Test")
	mustGit(t, repoPath, "config", "user.email", "test@openshock.local")
	if err := os.WriteFile(filepath.Join(repoPath, "README.md"), []byte("seed\n"), 0o644); err != nil {
		t.Fatalf("failed to write fixture file: %v", err)
	}
	mustGit(t, repoPath, "add", "README.md")
	mustGit(t, repoPath, "commit", "-m", "initial commit")
	return repoPath
}

func mustGit(t *testing.T, repoPath string, args ...string) string {
	t.Helper()

	cmd := exec.Command("git", args...)
	cmd.Dir = repoPath
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("git %s failed: %v\n%s", strings.Join(args, " "), err, string(output))
	}
	return string(output)
}

func writeFakeCodexBinary(t *testing.T) string {
	return writeFakeCodexBinaryWithFinalMessage(t, "fake codex completed task")
}

func writeFakeCodexBinaryWithFinalMessage(t *testing.T, finalMessage string) string {
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
    --skip-git-repo-check|--full-auto)
      shift
      ;;
    --sandbox)
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
printf '%s\n' '{"type":"tool_call","toolName":"openshock","arguments":"task create","status":"completed"}'
cat <<'EOF' > "$output_file"
` + finalMessage + `
EOF
printf '%s\n' "$instruction" > "$repo_path/agent-output.txt"
`
	if err := os.WriteFile(path, []byte(content), 0o755); err != nil {
		t.Fatalf("failed to write fake codex binary: %v", err)
	}
	return path
}
