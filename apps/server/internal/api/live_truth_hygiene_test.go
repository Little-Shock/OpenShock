package api

import (
	"testing"

	"github.com/Larkspur-Wang/OpenShock/apps/server/internal/store"
)

func TestSanitizeLivePayloadRemovesPlaceholderLeakage(t *testing.T) {
	state := store.State{
		Workspace: store.WorkspaceSnapshot{
			Name:          "OpenShock 作战台",
			Branch:        "feat/e2e-status-sync-20260405",
			Repo:          "Larkspur-Wang/OpenShock",
			RepoURL:       "https://github.com/Larkspur-Wang/OpenShock",
			PairedRuntime: "shock-main",
		},
		Channels: []store.Channel{{
			ID:      "announcements",
			Name:    "#announcements",
			Summary: "版本、Runtime 变化和制度公告。",
			Purpose: "这里只做广播。",
		}},
		ChannelMessages: map[string][]store.Message{
			"announcements": {
				{ID: "ann-1", Speaker: "System", Role: "system", Tone: "system", Message: "OPS-29 已自动升级成新的讨论间：?? live detail ?? 讨论间。", Time: "21:42"},
				{ID: "ann-2", Speaker: "System", Role: "system", Tone: "system", Message: "OPS-31 已自动升级成新的讨论间：E2E Status Sync 20260405 讨论间。", Time: "23:06"},
				{ID: "ann-3", Speaker: "System", Role: "system", Tone: "system", Message: "工作区已绑定仓库：Larkspur-Wang/OpenShock。", Time: "21:54"},
			},
		},
		Issues: []store.Issue{{
			ID:      "issue-live-detail",
			Key:     "OPS-29",
			Title:   "?? live detail ??",
			Summary: "?? Issue ? Run ????????????",
		}},
		Rooms: []store.Room{{
			ID:      "room-live-detail",
			Title:   "E2E ???? 20260405 讨论间",
			Summary: "?? Issue ? Run ????????????",
			Topic: store.Topic{
				ID:      "topic-live-detail",
				Title:   "?? live detail ??",
				Summary: "placeholder 注释窗口",
			},
		}},
		RoomMessages: map[string][]store.Message{
			"room-live-detail": {
				{ID: "room-1", Speaker: "System", Role: "system", Tone: "system", Message: "CLI 连接失败：Post \"E:\\\\00.Lark_Projects\\\\00_OpenShock\"", Time: "23:00"},
			},
		},
		Runs: []store.Run{{
			ID:           "run_live-detail_01",
			Branch:       "feat/e2e-status-sync-20260405",
			Worktree:     "wt-e2e-status-sync-20260405",
			WorktreePath: "E:\\\\00.Lark_Projects\\\\.openshock-worktrees\\\\00_OpenShock\\\\wt-e2e-status-sync-20260405",
			Summary:      "E2E ???? 20260405",
			NextAction:   "placeholder 注释窗口",
			Stdout:       []string{"worktree path: E:\\\\00.Lark_Projects\\\\.openshock-worktrees"},
			Stderr:       []string{"?? run stderr ??"},
			ToolCalls:    []store.ToolCall{{ID: "tool-1", Summary: "?? call ??", Result: "test-only"}},
			Timeline:     []store.RunEvent{{ID: "event-1", Label: "?? live detail ??", At: "23:00", Tone: "paper"}},
		}},
		Runtimes: []store.RuntimeRecord{{
			ID:            "shock-main",
			Machine:       "shock-main",
			DaemonURL:     "http://127.0.0.1:8090",
			Shell:         "bash",
			State:         "online",
			PairingState:  "paired",
			WorkspaceRoot: "/home/lark/OpenShock",
			ReportedAt:    "2026-04-09T00:00:00Z",
		}},
		Inbox: []store.InboxItem{{
			ID:      "inbox-1",
			Title:   "?? live detail ??",
			Room:    "E2E Status Sync 20260405 讨论间",
			Summary: "placeholder 注释窗口",
			Action:  "test-only action",
		}},
		RuntimeLeases: []store.RuntimeLease{{
			LeaseID:      "lease-1",
			Branch:       "feat/e2e-status-sync-20260405",
			WorktreeName: "wt-e2e-status-sync-20260405",
			WorktreePath: "E:\\\\00.Lark_Projects\\\\.openshock-worktrees\\\\00_OpenShock\\\\wt-e2e-status-sync-20260405",
			Cwd:          "E:\\\\00.Lark_Projects\\\\.openshock-worktrees\\\\00_OpenShock\\\\wt-e2e-status-sync-20260405",
			Summary:      "?? Issue ? Run ????????????",
		}},
		PullRequests: []store.PullRequest{{
			ID:            "pr-1",
			Title:         "E2E Status Sync 20260405",
			Branch:        "feat/e2e-status-sync-20260405",
			BaseBranch:    "?? base ??",
			ReviewSummary: "?? review summary ??",
		}},
		Sessions: []store.Session{{
			ID:           "session-1",
			Branch:       "feat/e2e-status-sync-20260405",
			Worktree:     "wt-e2e-status-sync-20260405",
			WorktreePath: "E:\\\\00.Lark_Projects\\\\.openshock-worktrees\\\\00_OpenShock\\\\wt-e2e-status-sync-20260405",
			Summary:      "E2E ???? 20260405",
			MemoryPaths:  []string{"notes/rooms/room-e2e-status-sync-20260405.md"},
		}},
		Memory: []store.MemoryArtifact{{
			ID:      "memory-1",
			Scope:   "room:room-e2e-status-sync-20260405",
			Path:    "notes/rooms/room-e2e-status-sync-20260405.md",
			Summary: "?? memory summary ??",
		}},
		MemoryVersions: map[string][]store.MemoryArtifactVersion{
			"memory-1": {{
				Version: 1,
				Summary: "E2E Status Sync 20260405",
				Content: "# E2E ???? 20260405 讨论间",
			}},
		},
	}

	sanitized := sanitizeLivePayload(state).(store.State)

	if got := sanitized.Workspace.Branch; got != "待整理分支" {
		t.Fatalf("workspace branch = %q, want sanitized fallback", got)
	}
	if got := sanitized.Issues[0].Title; got != "待整理任务" {
		t.Fatalf("issue title = %q, want sanitized fallback", got)
	}
	if got := sanitized.Rooms[0].Title; got != "待整理讨论间" {
		t.Fatalf("room title = %q, want sanitized fallback", got)
	}
	if got := sanitized.Rooms[0].Topic.Title; got != "待整理 Topic" {
		t.Fatalf("topic title = %q, want sanitized fallback", got)
	}
	if got := sanitized.ChannelMessages["announcements"][0].Message; got != "这条历史消息包含测试残留或乱码，已在当前工作区隐藏。" {
		t.Fatalf("announcement message = %q, want sanitized fallback", got)
	}
	if got := sanitized.ChannelMessages["announcements"][2].Message; got != "工作区已绑定仓库：Larkspur-Wang/OpenShock。" {
		t.Fatalf("safe message = %q, want untouched", got)
	}
	if got := sanitized.Runs[0].Summary; got != "当前 Run 正在整理执行摘要。" {
		t.Fatalf("run summary = %q, want sanitized fallback", got)
	}
	if got := sanitized.Runs[0].Branch; got != "待整理分支" {
		t.Fatalf("run branch = %q, want sanitized fallback", got)
	}
	if got := sanitized.Runs[0].WorktreePath; got != "当前 worktree 路径正在整理中。" {
		t.Fatalf("run worktree path = %q, want sanitized fallback", got)
	}
	if got := sanitized.Runtimes[0].WorkspaceRoot; got != "当前 runtime 工作区路径已隐藏。" {
		t.Fatalf("runtime workspace root = %q, want sanitized fallback", got)
	}
	if got := sanitized.Inbox[0].Title; got != "待整理信号" {
		t.Fatalf("inbox title = %q, want sanitized fallback", got)
	}
	if got := sanitized.RuntimeLeases[0].Summary; got != "当前 runtime lease 摘要正在整理中。" {
		t.Fatalf("runtime lease summary = %q, want sanitized fallback", got)
	}
	if got := sanitized.RuntimeLeases[0].Cwd; got != "当前工作目录正在整理中。" {
		t.Fatalf("runtime lease cwd = %q, want sanitized fallback", got)
	}
	if got := sanitized.PullRequests[0].Title; got != "待整理 PR" {
		t.Fatalf("pull request title = %q, want sanitized fallback", got)
	}
	if got := sanitized.PullRequests[0].Branch; got != "待整理分支" {
		t.Fatalf("pull request branch = %q, want sanitized fallback", got)
	}
	if got := sanitized.Sessions[0].Summary; got != "当前会话摘要正在整理中。" {
		t.Fatalf("session summary = %q, want sanitized fallback", got)
	}
	if got := sanitized.Sessions[0].MemoryPaths[0]; got != "当前 session 记忆路径正在整理中。" {
		t.Fatalf("session memory path = %q, want sanitized fallback", got)
	}
	if got := sanitized.Memory[0].Path; got != "notes/current-artifact.md" {
		t.Fatalf("memory path = %q, want sanitized fallback", got)
	}
	if got := sanitized.MemoryVersions["memory-1"][0].Content; got != "这条记忆内容包含测试残留或乱码，已在当前工作区隐藏。" {
		t.Fatalf("memory version content = %q, want sanitized fallback", got)
	}
}

func TestBuildStateStreamEventSanitizesSnapshot(t *testing.T) {
	event := buildStateStreamEvent(store.State{
		Issues: []store.Issue{{
			ID:      "issue-live-detail",
			Key:     "OPS-29",
			Title:   "?? live detail ??",
			Summary: "?? Issue ? Run ????????????",
		}},
		Runtimes: []store.RuntimeRecord{{
			ID:            "shock-main",
			Machine:       "shock-main",
			State:         "online",
			PairingState:  "paired",
			WorkspaceRoot: "/home/lark/OpenShock",
		}},
	}, 1)

	if got := event.State.Issues[0].Title; got != "待整理任务" {
		t.Fatalf("stream issue title = %q, want sanitized fallback", got)
	}
	if got := event.State.Runtimes[0].WorkspaceRoot; got != "当前 runtime 工作区路径已隐藏。" {
		t.Fatalf("stream runtime workspace root = %q, want sanitized fallback", got)
	}
}
