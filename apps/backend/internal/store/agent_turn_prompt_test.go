package store

import (
	"strings"
	"testing"

	"openshock/backend/internal/core"
)

func TestBuildAgentTurnInstructionUsesChatFirstPrompt(t *testing.T) {
	instruction := buildAgentTurnInstruction(core.AgentTurnExecution{
		Turn: core.AgentTurn{
			ID:         "turn_001",
			RoomID:     "room_001",
			AgentID:    "agent_shell",
			IntentType: "visible_message_response",
			WakeupMode: "direct_message",
			EventFrame: core.EventFrame{
				CurrentTarget:         "room:room_001",
				ContextSummary:        "Respond in room:room_001 for trigger message msg_001.",
				RecentMessagesSummary: "Sarah[message]: @agent_shell 有人吗？",
				ExpectedAction:        "visible_message_response",
			},
		},
		AgentName:   "Shell_Runner",
		AgentPrompt: "执行型工程师，适合承担具体实现和命令执行工作，习惯边做边验证。",
		Room:        core.RoomSummary{ID: "room_101", IssueID: "issue_101", Title: "Announcements", Kind: "issue"},
		Issue: &core.Issue{
			ID:       "issue_101",
			Title:    "Fix memory leak in observer pipeline",
			Status:   "in_progress",
			Priority: "urgent",
			RepoPath: "/tmp/openshock-repo",
		},
		Tasks: []core.Task{
			{
				ID:              "task_guard",
				Title:           "Add retention guard around handoff queue",
				Status:          "in_progress",
				AssigneeAgentID: "agent_shell",
				BranchName:      "issue-101/task-guard",
				RunCount:        1,
			},
		},
		Runs: []core.Run{
			{
				ID:            "run_guard_01",
				TaskID:        "task_guard",
				Status:        "approval_required",
				AgentID:       "agent_shell",
				BranchName:    "issue-101/task-guard",
				OutputPreview: "Proposed patch touches guarded billing code. Awaiting approval.",
			},
		},
		MergeAttempts: []core.MergeAttempt{
			{
				ID:           "merge_101",
				TaskID:       "task_guard",
				Status:       "queued",
				SourceBranch: "issue-101/task-guard",
				TargetBranch: "issue-101/integration",
			},
		},
		IntegrationBranch: &core.IntegrationBranch{
			Name:          "issue-101/integration",
			Status:        "integrating",
			MergedTaskIDs: []string{"task_diag"},
		},
		TriggerMessage: core.Message{
			ID:        "msg_001",
			ActorType: "member",
			ActorName: "Sarah",
			Kind:      "message",
			Body:      "@agent_shell 有人吗？",
		},
		Messages: []core.Message{
			{ActorName: "Sarah", Kind: "message", Body: "@agent_shell 有人吗？"},
		},
	})

	for _, expected := range []string{
		"KIND: <message|clarification_request|handoff|summary|no_response>",
		"生命周期：",
		"这个工作区会在同一个 OpenShock agent session 的后续回合之间持续复用",
		"工作区约定：",
		"深入思考前先阅读 MEMORY.md",
		"阅读 CURRENT_TURN.md，确认本回合的精确触发原因和回复契约",
		"notes/room-context.md",
		"notes/work-log.md",
		"请在结束前更新 MEMORY.md",
		"系统工作流约定：",
		"`openshock`",
		"openshock task create --issue issue_101",
		"openshock task claim --task <task_id> --actor-id agent_shell",
		"openshock run create --task <task_id> --actor-id agent_shell",
		"openshock git request-merge --task <task_id> --actor-id agent_shell",
		"openshock git approve-merge --task <task_id> --actor-id agent_shell",
		"openshock delivery request --issue issue_101 --actor-id agent_shell",
		"唤醒模式：direct_message。",
		"该模式下的第一步：",
		"先判断这条消息是否需要你可见地回复。",
		"自然语言",
		"回复契约：",
		"身份约定：",
		"你的稳定 OpenShock agent id 是 `agent_shell`。",
		"你在房间界面里的显示名是 `Shell_Runner`。",
		"这两个标签指向的是同一个 agent，也就是你。",
		"Agent Prompt：",
		"执行型工程师，适合承担具体实现和命令执行工作，习惯边做边验证。",
		"当前 Issue：issue_101 | Fix memory leak in observer pipeline | status=in_progress | priority=urgent",
		"默认 Repo：/tmp/openshock-repo",
		"task_guard | Add retention guard around handoff queue | status=in_progress | assignee=agent_shell | branch=issue-101/task-guard | 1 run",
		"run_guard_01 | task=task_guard | status=approval_required | agent=agent_shell | branch=issue-101/task-guard",
		"Integration Branch：issue-101/integration | status=integrating | merged=task_diag",
		"merge_101 | task=task_guard | status=queued | issue-101/task-guard -> issue-101/integration",
		"触发消息中的 mention 信号：@agent_shell",
	} {
		if !strings.Contains(instruction, expected) {
			t.Fatalf("expected instruction to contain %q, got:\n%s", expected, instruction)
		}
	}
	if strings.Contains(instruction, "plan|") {
		t.Fatalf("did not expect old plan-based reply format in instruction:\n%s", instruction)
	}
}

func TestBuildAgentTurnInstructionClarificationFollowupMode(t *testing.T) {
	instruction := buildAgentTurnInstruction(core.AgentTurnExecution{
		Turn: core.AgentTurn{
			ID:         "turn_002",
			RoomID:     "room_001",
			AgentID:    "agent_shell",
			IntentType: "clarification_followup",
			WakeupMode: "clarification_followup",
		},
		AgentName:   "Shell_Runner",
		AgentPrompt: "执行型工程师。",
		Room:        core.RoomSummary{ID: "room_001", Title: "Announcements"},
		TriggerMessage: core.Message{
			ID:        "msg_002",
			ActorType: "member",
			ActorName: "Sarah",
			Kind:      "message",
			Body:      "可以改 billing guard，继续。",
		},
	})

	for _, expected := range []string{
		"唤醒模式：clarification_followup。",
		"另一位参与者正在回应你之前提出的阻塞性澄清问题",
		"除非旧阻塞仍未解决，否则不要重复原来的阻塞点。",
	} {
		if !strings.Contains(instruction, expected) {
			t.Fatalf("expected clarification prompt to contain %q, got:\n%s", expected, instruction)
		}
	}
}

func TestBuildAgentTurnInstructionHandoffMode(t *testing.T) {
	instruction := buildAgentTurnInstruction(core.AgentTurnExecution{
		Turn: core.AgentTurn{
			ID:         "turn_003",
			RoomID:     "room_001",
			AgentID:    "agent_guardian",
			IntentType: "handoff_response",
			WakeupMode: "handoff_response",
		},
		AgentName:   "Guardian_Bot",
		AgentPrompt: "风险守门人。",
		Room:        core.RoomSummary{ID: "room_001", Title: "Announcements"},
		TriggerMessage: core.Message{
			ID:        "msg_003",
			ActorType: "agent",
			ActorName: "agent_shell",
			Kind:      "handoff",
			Body:      "@agent_guardian 这里需要你接手。",
		},
	})

	for _, expected := range []string{
		"唤醒模式：handoff_response。",
		"另一位 agent 明确要求你接手或继续这个线程",
		"默认这次唤醒意味着你被期待接手。",
	} {
		if !strings.Contains(instruction, expected) {
			t.Fatalf("expected handoff prompt to contain %q, got:\n%s", expected, instruction)
		}
	}
}
