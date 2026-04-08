package core

func SeedWorkspace() Workspace {
	return Workspace{
		ID:           "ws_01",
		Name:         "OpenShock.ai",
		RepoBindings: []WorkspaceRepoBinding{},
	}
}

func SeedRooms() []RoomSummary {
	return []RoomSummary{
		{ID: "room_001", Kind: "discussion", Title: "Announcements", UnreadCount: 1},
		{ID: "room_002", Kind: "discussion", Title: "Roadmap", UnreadCount: 1},
		{ID: "room_101", IssueID: "issue_101", Kind: "issue", Title: "Fix Memory Leak", UnreadCount: 3},
		{ID: "room_102", IssueID: "issue_102", Kind: "issue", Title: "Task Board Refresh", UnreadCount: 1},
		{ID: "room_103", IssueID: "issue_103", Kind: "issue", Title: "Latency Audit", UnreadCount: 0},
	}
}

func SeedAgents() []Agent {
	return []Agent{
		{ID: "agent_lead", Name: "Lead_Architect", Role: "Planner", Status: "active"},
		{ID: "agent_systems", Name: "Systems-Agent-01", Role: "Investigator", Status: "active"},
		{ID: "agent_guardian", Name: "Guardian_Bot", Role: "Reviewer", Status: "active"},
		{ID: "agent_shell", Name: "Shell_Runner", Role: "Executor", Status: "active"},
	}
}

func SeedRuntimes() []Runtime {
	return []Runtime{
		{ID: "rt_local", Name: "Local MBP", Status: "online", Provider: "codex"},
		{ID: "rt_ci", Name: "CI Lane", Status: "busy", Provider: "codex"},
	}
}

func SeedIssues() []Issue {
	return []Issue{
		{
			ID:       "issue_101",
			Title:    "Fix memory leak in observer pipeline",
			Status:   "in_progress",
			Priority: "urgent",
			Summary:  "The production observer handler keeps retaining stale buffers under burst load.",
		},
		{
			ID:       "issue_102",
			Title:    "Refresh task board layout and counters",
			Status:   "todo",
			Priority: "high",
			Summary:  "Align board density and state grouping with the new collaboration shell.",
		},
		{
			ID:       "issue_103",
			Title:    "Audit runtime latency spikes",
			Status:   "in_review",
			Priority: "medium",
			Summary:  "Trace intermittent latency on background sync runners and reduce false alerts.",
		},
	}
}

func SeedMessages() []Message {
	return []Message{
		{
			ID:        "msg_001",
			ActorType: "agent",
			ActorName: "Lead_Architect",
			Kind:      "summary",
			Body:      "I isolated the heap growth to the observer handoff path. We need one branch for diagnosis and one for a retention guard fix.",
			CreatedAt: "2026-04-05T08:00:00Z",
		},
		{
			ID:        "msg_002",
			ActorType: "agent",
			ActorName: "Systems-Agent-01",
			Kind:      "log",
			Body:      "Diagnostic initiated. Captured a strong reference chain from observer cache to retired event frames.",
			CreatedAt: "2026-04-05T08:03:00Z",
		},
		{
			ID:        "msg_003",
			ActorType: "agent",
			ActorName: "Guardian_Bot",
			Kind:      "blocked",
			Body:      "Quick action required: branch hotfix touches guarded billing code and needs approval before integration.",
			CreatedAt: "2026-04-05T08:06:00Z",
		},
	}
}

func SeedTasks() []Task {
	return []Task{
		{
			ID:              "task_diag",
			IssueID:         "issue_101",
			Title:           "Trace retained observer frames",
			Description:     "Confirm the retention path and produce a targeted fix note.",
			Status:          "integrated",
			AssigneeAgentID: "agent_systems",
			BranchName:      "issue-101/task-diag",
			RunCount:        2,
		},
		{
			ID:              "task_guard",
			IssueID:         "issue_101",
			Title:           "Add retention guard around handoff queue",
			Description:     "Patch the observer queue to drop stale references on handoff.",
			Status:          "in_progress",
			AssigneeAgentID: "agent_shell",
			BranchName:      "issue-101/task-guard",
			RunCount:        1,
		},
		{
			ID:              "task_review",
			IssueID:         "issue_101",
			Title:           "Review billing touchpoints before merge",
			Description:     "Validate branch changes near approval-sensitive billing logic.",
			Status:          "todo",
			AssigneeAgentID: "agent_guardian",
			BranchName:      "issue-101/task-review",
			RunCount:        0,
		},
		{
			ID:              "task_board_ui",
			IssueID:         "issue_102",
			Title:           "Compress board columns and badge layout",
			Description:     "Bring the task board in line with the latest shell design.",
			Status:          "todo",
			AssigneeAgentID: "agent_lead",
			BranchName:      "issue-102/task-board-ui",
			RunCount:        0,
		},
	}
}

func SeedRuns() []Run {
	return []Run{
		{
			ID:            "run_diag_01",
			TaskID:        "task_diag",
			AgentID:       "agent_systems",
			RuntimeID:     "rt_local",
			Status:        "completed",
			Title:         "Diagnostic trace on observer cache",
			OutputPreview: "Captured heap path from observer cache to retired event frames.",
		},
		{
			ID:            "run_guard_01",
			TaskID:        "task_guard",
			AgentID:       "agent_shell",
			RuntimeID:     "rt_ci",
			Status:        "approval_required",
			Title:         "Patch retention guard in handoff queue",
			OutputPreview: "Proposed patch touches guarded billing code. Awaiting approval.",
		},
		{
			ID:            "run_review_01",
			TaskID:        "task_review",
			AgentID:       "agent_guardian",
			RuntimeID:     "",
			Status:        "queued",
			Title:         "Review billing touchpoints before merge",
			OutputPreview: "Queued and waiting for runtime claim.",
		},
	}
}

func SeedIntegrationBranches() []IntegrationBranch {
	return []IntegrationBranch{
		{
			ID:            "ib_issue_101",
			IssueID:       "issue_101",
			Name:          "issue-101/integration",
			Status:        "integrating",
			MergedTaskIDs: []string{"task_diag"},
		},
		{
			ID:            "ib_issue_102",
			IssueID:       "issue_102",
			Name:          "issue-102/integration",
			Status:        "collecting",
			MergedTaskIDs: []string{},
		},
		{
			ID:            "ib_issue_103",
			IssueID:       "issue_103",
			Name:          "issue-103/integration",
			Status:        "ready_for_delivery",
			MergedTaskIDs: []string{},
		},
	}
}

func SeedDeliveryPRs() []DeliveryPR {
	return []DeliveryPR{
		{
			ID:      "pr_103",
			IssueID: "issue_103",
			Title:   "Merge runtime latency audit into main",
			Status:  "open",
		},
	}
}

func SeedInboxItems() []InboxItem {
	return []InboxItem{
		{
			ID:                "inbox_001",
			Title:             "Approval Required for Branch #102",
			Kind:              "approval_required",
			Severity:          "high",
			Summary:           "The retention guard patch changes billing-adjacent logic and needs human authorization.",
			RelatedEntityType: "run",
			RelatedEntityID:   "run_guard_01",
			PrimaryActionType: "Run.approve",
		},
		{
			ID:                "inbox_002",
			Title:             "Merge Conflict on Issue #101",
			Kind:              "merge_conflict",
			Severity:          "medium",
			Summary:           "The integration branch needs a follow-up fix before the guard task can merge cleanly.",
			RelatedEntityType: "task",
			RelatedEntityID:   "task_guard",
			PrimaryActionType: "GitIntegration.merge.approve",
		},
		{
			ID:       "inbox_003",
			Title:    "Sarah asked for help in #general",
			Kind:     "human_help",
			Severity: "low",
			Summary:  "Review the architecture sketch before the next issue decomposition pass.",
		},
	}
}
