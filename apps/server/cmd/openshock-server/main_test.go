package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Larkspur-Wang/OpenShock/apps/server/internal/store"
)

func TestSanitizePersistedStateOnStartupRewritesDirtyStateFile(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "phase0", "state.json")

	initial, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New() error = %v", err)
	}

	dirty := initial.Snapshot()
	dirty.ChannelMessages["announcements"] = []store.Message{{
		ID:      "ann-live-detail",
		Speaker: "System",
		Role:    "system",
		Tone:    "system",
		Message: "OPS-29 已自动升级成新的讨论间：?? live detail ?? 讨论间。",
		Time:    "21:42",
	}}
	dirty.Issues = []store.Issue{{
		ID:      "issue-live-detail",
		Key:     "OPS-29",
		Title:   "?? live detail ??",
		Summary: "??????????:Issue?Room?Run?PR?Inbox?Memory?",
	}}
	dirty.Rooms = []store.Room{{
		ID:       "room-live-detail",
		IssueKey: "OPS-29",
		Title:    "E2E ???? 20260405 讨论间",
		Summary:  "???????? smoke ??????",
	}}

	body, err := json.MarshalIndent(dirty, "", "  ")
	if err != nil {
		t.Fatalf("json.MarshalIndent() error = %v", err)
	}
	if err := os.WriteFile(statePath, body, 0o644); err != nil {
		t.Fatalf("os.WriteFile() error = %v", err)
	}

	reloaded, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New(reload) error = %v", err)
	}

	changed, err := sanitizePersistedStateOnStartup(reloaded)
	if err != nil {
		t.Fatalf("sanitizePersistedStateOnStartup() error = %v", err)
	}
	if !changed {
		t.Fatalf("sanitizePersistedStateOnStartup() changed = false, want true")
	}

	onDisk, err := os.ReadFile(statePath)
	if err != nil {
		t.Fatalf("os.ReadFile() error = %v", err)
	}
	for _, needle := range []string{
		"?? live detail ??",
		"E2E ???? 20260405",
		"??????????:Issue?Room?Run?PR?Inbox?Memory?",
		"???????? smoke ??????",
	} {
		if strings.Contains(string(onDisk), needle) {
			t.Fatalf("persisted state leaked %q after startup sanitize", needle)
		}
	}

	sanitized := reloaded.Snapshot()
	if got := sanitized.ChannelMessages["announcements"][0].Message; got != "这条历史消息包含测试残留或乱码，已在当前工作区隐藏。" {
		t.Fatalf("announcement message = %q, want sanitized fallback", got)
	}
	if got := sanitized.Issues[0].Title; got != "待整理任务" {
		t.Fatalf("issue title = %q, want sanitized fallback", got)
	}
	if got := sanitized.Rooms[0].Title; got != "待整理讨论间" {
		t.Fatalf("room title = %q, want sanitized fallback", got)
	}
}

func TestSanitizePersistedStateOnStartupKeepsFreshPairingOperationallyBlank(t *testing.T) {
	t.Setenv("OPENSHOCK_BOOTSTRAP_MODE", "fresh")

	t.Run("新环境未配对时不把展示占位写进状态文件", func(t *testing.T) {
		root := t.TempDir()
		statePath := filepath.Join(root, "data", "phase0", "state.json")

		freshStore, err := store.New(statePath, root)
		if err != nil {
			t.Fatalf("store.New() error = %v", err)
		}

		if _, err := sanitizePersistedStateOnStartup(freshStore); err != nil {
			t.Fatalf("sanitizePersistedStateOnStartup() error = %v", err)
		}

		snapshot := freshStore.Snapshot()
		if snapshot.Workspace.PairedRuntime != "" || snapshot.Workspace.PairedRuntimeURL != "" || snapshot.Workspace.PairingStatus != "unpaired" {
			t.Fatalf("fresh persisted pairing = %q/%q/%q, want empty runtime/url and unpaired", snapshot.Workspace.PairedRuntime, snapshot.Workspace.PairedRuntimeURL, snapshot.Workspace.PairingStatus)
		}

		onDisk, err := os.ReadFile(statePath)
		if err != nil {
			t.Fatalf("os.ReadFile() error = %v", err)
		}
		if strings.Contains(string(onDisk), "当前运行环境还没同步。") {
			t.Fatalf("persisted fresh state should not contain runtime display fallback")
		}
	})

	t.Run("旧污染状态启动后恢复成真实未配对", func(t *testing.T) {
		root := t.TempDir()
		statePath := filepath.Join(root, "data", "phase0", "state.json")

		freshStore, err := store.New(statePath, root)
		if err != nil {
			t.Fatalf("store.New() error = %v", err)
		}
		dirty := freshStore.Snapshot()
		dirty.Workspace.PairedRuntime = "当前运行环境还没同步。"
		dirty.Workspace.PairedRuntimeURL = "http://127.0.0.1:8090"
		dirty.Workspace.PairingStatus = "degraded"

		body, err := json.MarshalIndent(dirty, "", "  ")
		if err != nil {
			t.Fatalf("json.MarshalIndent() error = %v", err)
		}
		if err := os.WriteFile(statePath, body, 0o644); err != nil {
			t.Fatalf("os.WriteFile() error = %v", err)
		}

		reloaded, err := store.New(statePath, root)
		if err != nil {
			t.Fatalf("store.New(reload) error = %v", err)
		}
		if _, err := sanitizePersistedStateOnStartup(reloaded); err != nil {
			t.Fatalf("sanitizePersistedStateOnStartup() error = %v", err)
		}

		snapshot := reloaded.Snapshot()
		if snapshot.Workspace.PairedRuntime != "" || snapshot.Workspace.PairedRuntimeURL != "" || snapshot.Workspace.PairingStatus != "unpaired" {
			t.Fatalf("cleaned persisted pairing = %q/%q/%q, want empty runtime/url and unpaired", snapshot.Workspace.PairedRuntime, snapshot.Workspace.PairedRuntimeURL, snapshot.Workspace.PairingStatus)
		}
	})
}
