package daemon

import (
	"fmt"
	"os"
	"path/filepath"
)

type WorktreeManager struct {
	root string
}

func NewWorktreeManager(root string) (*WorktreeManager, error) {
	if root == "" {
		return nil, fmt.Errorf("worktree root is required")
	}
	if err := os.MkdirAll(root, 0o755); err != nil {
		return nil, fmt.Errorf("create worktree root: %w", err)
	}
	return &WorktreeManager{root: root}, nil
}

func (m *WorktreeManager) EnsureLane(laneID string) (string, error) {
	lanePath := filepath.Join(m.root, "lanes", laneID)
	worktreePath := filepath.Join(lanePath, "worktree")
	runsPath := filepath.Join(lanePath, "runs")

	if err := os.MkdirAll(worktreePath, 0o755); err != nil {
		return "", fmt.Errorf("create lane worktree path: %w", err)
	}
	if err := os.MkdirAll(runsPath, 0o755); err != nil {
		return "", fmt.Errorf("create lane runs path: %w", err)
	}
	return worktreePath, nil
}

func (m *WorktreeManager) EnsureRunPath(laneID, runID string) (string, error) {
	runPath := filepath.Join(m.root, "lanes", laneID, "runs", runID)
	if err := os.MkdirAll(runPath, 0o755); err != nil {
		return "", fmt.Errorf("create run path: %w", err)
	}
	return runPath, nil
}

func (m *WorktreeManager) LaneRoot(laneID string) string {
	return filepath.Join(m.root, "lanes", laneID)
}
