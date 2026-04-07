package api

import (
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/Larkspur-Wang/OpenShock/apps/daemon/internal/runtime"
	"github.com/Larkspur-Wang/OpenShock/apps/daemon/internal/worktree"
)

type daemonLeaseConflict struct {
	LeaseID       string `json:"leaseId,omitempty"`
	RunID         string `json:"runId,omitempty"`
	SessionID     string `json:"sessionId,omitempty"`
	RoomID        string `json:"roomId,omitempty"`
	Operation     string `json:"operation"`
	Key           string `json:"key"`
	Cwd           string `json:"cwd,omitempty"`
	WorkspaceRoot string `json:"workspaceRoot,omitempty"`
	WorktreeName  string `json:"worktreeName,omitempty"`
	AcquiredAt    string `json:"acquiredAt"`
}

type daemonLeaseEntry struct {
	claim daemonLeaseConflict
	refs  int
}

type leaseGuard struct {
	mu        sync.Mutex
	exec      map[string]daemonLeaseEntry
	worktrees map[string]daemonLeaseEntry
}

func newLeaseGuard() *leaseGuard {
	return &leaseGuard{
		exec:      make(map[string]daemonLeaseEntry),
		worktrees: make(map[string]daemonLeaseEntry),
	}
}

func (g *leaseGuard) acquireExec(req runtime.ExecRequest, defaultRoot string) (func(), *daemonLeaseConflict) {
	cwd := normalizeLeasePath(strings.TrimSpace(req.Cwd))
	if cwd == "" {
		cwd = normalizeLeasePath(defaultRoot)
	}
	if cwd == "" {
		cwd = "."
	}

	claim := daemonLeaseConflict{
		LeaseID:    firstNonEmpty(strings.TrimSpace(req.LeaseID), strings.TrimSpace(req.SessionID), strings.TrimSpace(req.RunID), strings.TrimSpace(req.RoomID), cwd),
		RunID:      strings.TrimSpace(req.RunID),
		SessionID:  strings.TrimSpace(req.SessionID),
		RoomID:     strings.TrimSpace(req.RoomID),
		Operation:  "exec",
		Key:        cwd,
		Cwd:        cwd,
		AcquiredAt: time.Now().UTC().Format(time.RFC3339Nano),
	}
	return g.acquire(g.exec, cwd, claim)
}

func (g *leaseGuard) acquireWorktree(req worktree.Request, defaultRoot string) (func(), *daemonLeaseConflict) {
	root := normalizeLeasePath(strings.TrimSpace(req.WorkspaceRoot))
	if root == "" {
		root = normalizeLeasePath(defaultRoot)
	}
	worktreeName := strings.TrimSpace(req.WorktreeName)
	if worktreeName == "" {
		worktreeName = strings.ReplaceAll(strings.TrimPrefix(strings.TrimSpace(req.Branch), "feat/"), "/", "-")
	}
	if worktreeName == "" {
		worktreeName = strings.TrimSpace(req.Branch)
	}
	key := strings.TrimSpace(root)
	if key != "" {
		key += "::"
	}
	key += strings.TrimSpace(worktreeName)
	if key == "" {
		key = "anonymous-worktree"
	}

	claim := daemonLeaseConflict{
		LeaseID:       firstNonEmpty(strings.TrimSpace(req.LeaseID), strings.TrimSpace(req.SessionID), strings.TrimSpace(req.RunID), strings.TrimSpace(req.RoomID), key),
		RunID:         strings.TrimSpace(req.RunID),
		SessionID:     strings.TrimSpace(req.SessionID),
		RoomID:        strings.TrimSpace(req.RoomID),
		Operation:     "worktree",
		Key:           key,
		WorkspaceRoot: root,
		WorktreeName:  strings.TrimSpace(worktreeName),
		AcquiredAt:    time.Now().UTC().Format(time.RFC3339Nano),
	}
	return g.acquire(g.worktrees, key, claim)
}

func (g *leaseGuard) acquire(target map[string]daemonLeaseEntry, key string, claim daemonLeaseConflict) (func(), *daemonLeaseConflict) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if existing, ok := target[key]; ok {
		if sameLeaseHolder(existing.claim, claim) {
			existing.refs++
			target[key] = existing
			return func() {
				g.release(target, key)
			}, nil
		}
		conflict := existing.claim
		return nil, &conflict
	}
	target[key] = daemonLeaseEntry{
		claim: claim,
		refs:  1,
	}
	return func() {
		g.release(target, key)
	}, nil
}

func (g *leaseGuard) release(target map[string]daemonLeaseEntry, key string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	entry, ok := target[key]
	if !ok {
		return
	}
	entry.refs--
	if entry.refs <= 0 {
		delete(target, key)
		return
	}
	target[key] = entry
}

func sameLeaseHolder(left, right daemonLeaseConflict) bool {
	if strings.TrimSpace(left.LeaseID) != "" && strings.TrimSpace(left.LeaseID) == strings.TrimSpace(right.LeaseID) {
		return true
	}
	if strings.TrimSpace(left.SessionID) != "" && strings.TrimSpace(left.SessionID) == strings.TrimSpace(right.SessionID) {
		return true
	}
	if strings.TrimSpace(left.RunID) != "" && strings.TrimSpace(left.RunID) == strings.TrimSpace(right.RunID) {
		return true
	}
	return strings.TrimSpace(left.RoomID) != "" && strings.TrimSpace(left.RoomID) == strings.TrimSpace(right.RoomID)
}

func normalizeLeasePath(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	if absolute, err := filepath.Abs(path); err == nil {
		path = absolute
	}
	return filepath.Clean(path)
}

func formatLeaseConflictError(conflict daemonLeaseConflict) string {
	target := strings.TrimSpace(conflict.Cwd)
	if target == "" {
		target = strings.TrimSpace(conflict.WorktreeName)
	}
	if target == "" {
		target = strings.TrimSpace(conflict.Key)
	}
	holder := firstNonEmpty(strings.TrimSpace(conflict.SessionID), strings.TrimSpace(conflict.RunID), strings.TrimSpace(conflict.RoomID), strings.TrimSpace(conflict.LeaseID))
	if holder == "" {
		holder = "another active runtime lease"
	}
	return fmt.Sprintf("runtime lease conflict: %s is already held by %s", target, holder)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}
