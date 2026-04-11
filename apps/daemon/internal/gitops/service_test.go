package gitops

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCreateBranchAndMergeSuccess(t *testing.T) {
	repoPath := newGitFixtureRepo(t)
	service := New()
	ctx := context.Background()

	if err := service.CreateBranch(ctx, repoPath, "main", "issue-101/integration"); err != nil {
		t.Fatalf("create integration branch failed: %v", err)
	}
	if err := service.CreateBranch(ctx, repoPath, "issue-101/integration", "issue-101/task-guard"); err != nil {
		t.Fatalf("create task branch failed: %v", err)
	}

	mustGit(t, repoPath, "checkout", "issue-101/task-guard")
	writeFile(t, filepath.Join(repoPath, "feature.txt"), "feature from task branch\n")
	mustGit(t, repoPath, "add", "feature.txt")
	mustGit(t, repoPath, "commit", "-m", "add task feature")

	result, err := service.MergeBranch(ctx, repoPath, "issue-101/task-guard", "issue-101/integration")
	if err != nil {
		t.Fatalf("merge failed: %v", err)
	}
	if result.Status != MergeStatusSucceeded {
		t.Fatalf("expected merge success, got %q", result.Status)
	}

	content, err := os.ReadFile(filepath.Join(repoPath, "feature.txt"))
	if err != nil {
		t.Fatalf("failed to read merged file: %v", err)
	}
	if strings.TrimSpace(string(content)) != "feature from task branch" {
		t.Fatalf("unexpected merged file content: %q", string(content))
	}
}

func TestMergeConflictReturnsConflictAndAborts(t *testing.T) {
	repoPath := newGitFixtureRepo(t)
	service := New()
	ctx := context.Background()

	if err := service.CreateBranch(ctx, repoPath, "main", "issue-101/integration"); err != nil {
		t.Fatalf("create integration branch failed: %v", err)
	}
	if err := service.CreateBranch(ctx, repoPath, "issue-101/integration", "issue-101/task-a"); err != nil {
		t.Fatalf("create task branch failed: %v", err)
	}

	mustGit(t, repoPath, "checkout", "issue-101/task-a")
	writeFile(t, filepath.Join(repoPath, "shared.txt"), "task branch version\n")
	mustGit(t, repoPath, "add", "shared.txt")
	mustGit(t, repoPath, "commit", "-m", "task branch edit")

	mustGit(t, repoPath, "checkout", "issue-101/integration")
	writeFile(t, filepath.Join(repoPath, "shared.txt"), "integration branch version\n")
	mustGit(t, repoPath, "add", "shared.txt")
	mustGit(t, repoPath, "commit", "-m", "integration edit")

	result, err := service.MergeBranch(ctx, repoPath, "issue-101/task-a", "issue-101/integration")
	if err != nil {
		t.Fatalf("merge returned unexpected error: %v", err)
	}
	if result.Status != MergeStatusConflicted {
		t.Fatalf("expected merge conflict, got %q", result.Status)
	}

	statusOutput := mustGit(t, repoPath, "status", "--short")
	if strings.TrimSpace(statusOutput) != "" {
		t.Fatalf("expected clean repo after merge abort, got %q", statusOutput)
	}

	content, err := os.ReadFile(filepath.Join(repoPath, "shared.txt"))
	if err != nil {
		t.Fatalf("failed to read file after aborted merge: %v", err)
	}
	if strings.TrimSpace(string(content)) != "integration branch version" {
		t.Fatalf("expected integration version to remain after abort, got %q", string(content))
	}
}

func TestMergeBranchCreatesMissingSourceBranchFromTarget(t *testing.T) {
	repoPath := newGitFixtureRepo(t)
	service := New()
	ctx := context.Background()

	if err := service.CreateBranch(ctx, repoPath, "main", "issue-101/integration"); err != nil {
		t.Fatalf("create integration branch failed: %v", err)
	}

	result, err := service.MergeBranch(ctx, repoPath, "issue-101/task-empty", "issue-101/integration")
	if err != nil {
		t.Fatalf("merge failed: %v", err)
	}
	if result.Status != MergeStatusSucceeded {
		t.Fatalf("expected merge success, got %q", result.Status)
	}

	currentBranch := strings.TrimSpace(mustGit(t, repoPath, "branch", "--show-current"))
	if currentBranch != "issue-101/integration" {
		t.Fatalf("expected to stay on integration branch, got %q", currentBranch)
	}

	if _, err := runGit(ctx, repoPath, "rev-parse", "--verify", "issue-101/task-empty"); err != nil {
		t.Fatalf("expected missing source branch to be created, got %v", err)
	}
}

func TestCommitAllCommitsDirtyWorkingTree(t *testing.T) {
	repoPath := newGitFixtureRepo(t)
	service := New()
	ctx := context.Background()

	writeFile(t, filepath.Join(repoPath, "notes.txt"), "walkthrough note\n")

	committed, err := service.CommitAll(ctx, repoPath, "add walkthrough note")
	if err != nil {
		t.Fatalf("commit all returned error: %v", err)
	}
	if !committed {
		t.Fatal("expected dirty working tree to be committed")
	}

	statusOutput := mustGit(t, repoPath, "status", "--short")
	if strings.TrimSpace(statusOutput) != "" {
		t.Fatalf("expected clean repo after commit, got %q", statusOutput)
	}
}

func TestCommitAllSkipsCleanWorkingTree(t *testing.T) {
	repoPath := newGitFixtureRepo(t)
	service := New()
	ctx := context.Background()

	committed, err := service.CommitAll(ctx, repoPath, "noop")
	if err != nil {
		t.Fatalf("commit all returned error: %v", err)
	}
	if committed {
		t.Fatal("expected clean working tree to skip commit")
	}
}

func TestRestoreWorktreeDiscardsDirtyChanges(t *testing.T) {
	repoPath := newGitFixtureRepo(t)
	service := New()
	ctx := context.Background()

	writeFile(t, filepath.Join(repoPath, "README.md"), "dirty change\n")
	writeFile(t, filepath.Join(repoPath, "scratch.txt"), "temp file\n")

	if err := service.RestoreWorktree(ctx, repoPath); err != nil {
		t.Fatalf("restore worktree returned error: %v", err)
	}

	statusOutput := mustGit(t, repoPath, "status", "--short")
	if strings.TrimSpace(statusOutput) != "" {
		t.Fatalf("expected clean repo after restore, got %q", statusOutput)
	}

	content, err := os.ReadFile(filepath.Join(repoPath, "README.md"))
	if err != nil {
		t.Fatalf("failed to read README after restore: %v", err)
	}
	if strings.TrimSpace(string(content)) != "seed" {
		t.Fatalf("expected README to reset to HEAD, got %q", string(content))
	}
	if _, err := os.Stat(filepath.Join(repoPath, "scratch.txt")); !os.IsNotExist(err) {
		t.Fatalf("expected scratch file to be removed, got err=%v", err)
	}
}

func newGitFixtureRepo(t *testing.T) string {
	t.Helper()

	repoPath := t.TempDir()
	mustGit(t, repoPath, "init", "-b", "main")
	mustGit(t, repoPath, "config", "user.name", "OpenShock Test")
	mustGit(t, repoPath, "config", "user.email", "test@openshock.local")

	writeFile(t, filepath.Join(repoPath, "README.md"), "seed\n")
	writeFile(t, filepath.Join(repoPath, "shared.txt"), "base version\n")
	mustGit(t, repoPath, "add", "README.md", "shared.txt")
	mustGit(t, repoPath, "commit", "-m", "initial commit")

	return repoPath
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()

	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("failed to write file %s: %v", path, err)
	}
}

func mustGit(t *testing.T, repoPath string, args ...string) string {
	t.Helper()

	output, err := runGit(context.Background(), repoPath, args...)
	if err != nil {
		t.Fatalf("git %s failed: %v\n%s", strings.Join(args, " "), err, output)
	}
	return output
}
