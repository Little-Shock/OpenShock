package main

import (
	"context"
	"flag"
	"log"
	"os"
	"strings"
	"time"

	"openshock/daemon/internal/acp"
	"openshock/daemon/internal/client"
	"openshock/daemon/internal/gitops"
	"openshock/daemon/internal/provider/codex"
)

func main() {
	var (
		baseURL   = flag.String("api-base-url", envOr("OPENSHOCK_API_BASE_URL", "http://localhost:8080"), "OpenShock backend base URL")
		name      = flag.String("name", envOr("OPENSHOCK_RUNTIME_NAME", "Local Daemon"), "Runtime display name")
		provider  = flag.String("provider", envOr("OPENSHOCK_PROVIDER", "codex"), "Execution provider")
		slotCount = flag.Int("slots", 2, "Available execution slots")
		once      = flag.Bool("once", false, "Run one register/claim/report cycle and exit")
	)
	flag.Parse()

	ctx := context.Background()
	api := client.New(*baseURL)
	gitService := gitops.New()
	codexExecutor := codex.NewExecutor()
	codexBin := envOr("OPENSHOCK_CODEX_BIN", "codex")

	runtimeResp, err := api.RegisterRuntime(ctx, client.RegisterRuntimeRequest{
		Name:      *name,
		Provider:  *provider,
		SlotCount: *slotCount,
	})
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("registered runtime %s (%s)", runtimeResp.Runtime.ID, runtimeResp.Runtime.Name)

	heartbeat := func() {
		if _, err := api.HeartbeatRuntime(ctx, runtimeResp.Runtime.ID, client.RuntimeHeartbeatRequest{Status: "online"}); err != nil {
			log.Printf("heartbeat failed: %v", err)
		}
	}

	agentTurnCycle := func() {
		heartbeat()
		claim, err := api.ClaimAgentTurn(ctx, runtimeResp.Runtime.ID)
		if err != nil {
			if client.IsHTTPStatus(err, 404) {
				return
			}
			log.Printf("agent turn claim failed: %v", err)
			return
		}
		if !claim.Claimed || claim.AgentTurn == nil {
			log.Printf("no queued agent turns available")
			return
		}

		log.Printf("claimed agent turn %s for agent %s in room %s", claim.AgentTurn.Turn.ID, claim.AgentTurn.Turn.AgentID, claim.AgentTurn.Turn.RoomID)

		tmpDir, err := os.MkdirTemp("", "openshock-agent-turn-*")
		if err != nil {
			log.Printf("failed to allocate agent turn temp dir: %v", err)
			return
		}
		defer os.RemoveAll(tmpDir)

		result, err := codexExecutor.Execute(ctx, codex.ExecuteRequest{
			RepoPath:     tmpDir,
			Instruction:  buildAgentTurnInstruction(*claim.AgentTurn),
			CodexBinPath: codexBin,
		}, nil)

		reply := parseAgentTurnReply(result.LastMessage)
		body := reply.Body
		kind := reply.Kind
		if err != nil {
			log.Printf("agent turn %s execution failed: %v", claim.AgentTurn.Turn.ID, err)
			body = summarizeFailure(result.RawOutput, err)
			kind = "blocked"
		}
		resultMessageID := ""
		if kind == "no_response" {
			body = ""
		} else {
			if body == "" {
				body = "收到，我先看一下。"
			}

			actionResp, submitErr := api.SubmitAction(ctx, client.ActionRequest{
				ActorType:      "agent",
				ActorID:        claim.AgentTurn.Turn.AgentID,
				ActionType:     "RoomMessage.post",
				TargetType:     "room",
				TargetID:       claim.AgentTurn.Turn.RoomID,
				IdempotencyKey: "agent-turn-" + claim.AgentTurn.Turn.ID,
				Payload: map[string]any{
					"body": body,
					"kind": kind,
				},
			})
			if submitErr != nil {
				log.Printf("failed to post agent turn reply: %v", submitErr)
				return
			}
			resultMessageID = actionEntityID(actionResp, "message")
		}

		if _, err := api.CompleteAgentTurn(ctx, claim.AgentTurn.Turn.ID, client.AgentTurnCompleteRequest{
			RuntimeID:       runtimeResp.Runtime.ID,
			ResultMessageID: resultMessageID,
		}); err != nil {
			log.Printf("failed to complete agent turn %s: %v", claim.AgentTurn.Turn.ID, err)
			return
		}

		log.Printf("completed agent turn %s", claim.AgentTurn.Turn.ID)
	}

	runCycle := func() {
		heartbeat()
		claim, err := api.ClaimRun(ctx, runtimeResp.Runtime.ID)
		if err != nil {
			log.Printf("claim failed: %v", err)
			return
		}
		if !claim.Claimed || claim.Run == nil {
			log.Printf("no queued runs available")
			return
		}

		log.Printf("claimed run %s for task %s", claim.Run.ID, claim.Run.TaskID)

		if _, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
			RuntimeID:     runtimeResp.Runtime.ID,
			EventType:     "started",
			OutputPreview: "daemon started execution",
		}); err != nil {
			log.Printf("failed to post started event: %v", err)
			return
		}

		if strings.TrimSpace(claim.Run.RepoPath) == "" {
			if _, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				OutputPreview: "run is missing repoPath",
			}); err != nil {
				log.Printf("failed to post failed event: %v", err)
			}
			return
		}
		if strings.TrimSpace(claim.Run.BranchName) == "" || strings.TrimSpace(claim.Run.BaseBranch) == "" {
			if _, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				OutputPreview: "run is missing branch metadata",
			}); err != nil {
				log.Printf("failed to post failed event: %v", err)
			}
			return
		}
		if err := gitService.EnsureBranch(ctx, claim.Run.RepoPath, claim.Run.BaseBranch, claim.Run.BranchName); err != nil {
			if _, postErr := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				OutputPreview: summarizeMergeOutput(err.Error()),
			}); postErr != nil {
				log.Printf("failed to post branch-prepare failure: %v", postErr)
			}
			return
		}

		result, err := codexExecutor.Execute(ctx, codex.ExecuteRequest{
			RepoPath:     claim.Run.RepoPath,
			Instruction:  claim.Run.Instruction,
			CodexBinPath: codexBin,
		}, func(event acp.Event) error {
			switch event.Kind {
			case acp.EventStdoutChunk:
				if strings.TrimSpace(event.Content) == "" {
					return nil
				}
				_, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
					RuntimeID:     runtimeResp.Runtime.ID,
					EventType:     "output",
					OutputPreview: summarizeMergeOutput(event.Content),
					Message:       event.Content,
					Stream:        "stdout",
				})
				return err
			case acp.EventStderrChunk:
				if strings.TrimSpace(event.Content) == "" {
					return nil
				}
				_, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
					RuntimeID:     runtimeResp.Runtime.ID,
					EventType:     "output",
					OutputPreview: summarizeMergeOutput(event.Content),
					Message:       event.Content,
					Stream:        "stderr",
				})
				return err
			case acp.EventToolCall:
				if event.ToolCall == nil || strings.TrimSpace(event.ToolCall.ToolName) == "" {
					return nil
				}
				_, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
					RuntimeID: runtimeResp.Runtime.ID,
					EventType: "tool_call",
					ToolCall: &client.ToolCallInput{
						ToolName:  event.ToolCall.ToolName,
						Arguments: event.ToolCall.Arguments,
						Status:    event.ToolCall.Status,
					},
				})
				return err
			case acp.EventCompleted:
				return nil
			default:
				return nil
			}
		})
		if err != nil {
			log.Printf("run %s execution failed: %v", claim.Run.ID, err)
			if _, postErr := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				OutputPreview: summarizeFailure(result.RawOutput, err),
			}); postErr != nil {
				log.Printf("failed to post codex failure: %v", postErr)
			}
			return
		}
		if _, err := gitService.CommitAll(ctx, claim.Run.RepoPath, buildRunCommitMessage(*claim.Run)); err != nil {
			if _, postErr := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				OutputPreview: summarizeFailure("", err),
			}); postErr != nil {
				log.Printf("failed to post git commit failure: %v", postErr)
			}
			return
		}

		if _, err := api.PostRunEvent(ctx, claim.Run.ID, client.RunEventRequest{
			RuntimeID:     runtimeResp.Runtime.ID,
			EventType:     "completed",
			OutputPreview: summarizeMergeOutput(result.LastMessage),
		}); err != nil {
			log.Printf("failed to post completed event: %v", err)
			return
		}

		log.Printf("completed run %s on branch %s", claim.Run.ID, claim.Run.BranchName)
	}

	mergeCycle := func() {
		heartbeat()
		claim, err := api.ClaimMerge(ctx, runtimeResp.Runtime.ID)
		if err != nil {
			log.Printf("merge claim failed: %v", err)
			return
		}
		if !claim.Claimed || claim.MergeAttempt == nil {
			log.Printf("no queued merge attempts available")
			return
		}

		log.Printf("claimed merge attempt %s for task %s", claim.MergeAttempt.ID, claim.MergeAttempt.TaskID)

		if _, err := api.PostMergeEvent(ctx, claim.MergeAttempt.ID, client.MergeEventRequest{
			RuntimeID:     runtimeResp.Runtime.ID,
			EventType:     "started",
			ResultSummary: "daemon started merge execution",
		}); err != nil {
			log.Printf("failed to post merge started event: %v", err)
			return
		}

		if strings.TrimSpace(claim.MergeAttempt.RepoPath) == "" {
			if _, err := api.PostMergeEvent(ctx, claim.MergeAttempt.ID, client.MergeEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				ResultSummary: "merge attempt is missing repoPath",
			}); err != nil {
				log.Printf("failed to post merge failed event: %v", err)
			}
			return
		}

		result, err := gitService.MergeBranch(ctx, claim.MergeAttempt.RepoPath, claim.MergeAttempt.SourceBranch, claim.MergeAttempt.TargetBranch)
		if err != nil {
			if _, postErr := api.PostMergeEvent(ctx, claim.MergeAttempt.ID, client.MergeEventRequest{
				RuntimeID:     runtimeResp.Runtime.ID,
				EventType:     "failed",
				ResultSummary: summarizeMergeOutput(err.Error()),
			}); postErr != nil {
				log.Printf("failed to post merge failed event: %v", postErr)
			}
			return
		}

		eventType := "failed"
		switch result.Status {
		case gitops.MergeStatusSucceeded:
			eventType = "succeeded"
		case gitops.MergeStatusConflicted:
			eventType = "conflicted"
		}
		if _, err := api.PostMergeEvent(ctx, claim.MergeAttempt.ID, client.MergeEventRequest{
			RuntimeID:     runtimeResp.Runtime.ID,
			EventType:     eventType,
			ResultSummary: summarizeMergeOutput(result.Output),
		}); err != nil {
			log.Printf("failed to post merge %s event: %v", eventType, err)
			return
		}

		log.Printf("completed merge attempt %s with status %s", claim.MergeAttempt.ID, eventType)
	}

	if *once {
		agentTurnCycle()
		runCycle()
		mergeCycle()
		return
	}

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		agentTurnCycle()
		runCycle()
		mergeCycle()
		<-ticker.C
	}
}

func envOr(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func summarizeMergeOutput(value string) string {
	summary := strings.TrimSpace(value)
	if summary == "" {
		return "merge completed without output"
	}
	const maxLen = 240
	if len(summary) <= maxLen {
		return summary
	}
	return summary[:maxLen]
}

func summarizeFailure(rawOutput string, err error) string {
	summary := strings.TrimSpace(rawOutput)
	if summary != "" {
		return summarizeMergeOutput(summary)
	}
	if err == nil {
		return "run failed without output"
	}
	return summarizeMergeOutput(err.Error())
}

func buildAgentTurnInstruction(execution client.AgentTurnExecution) string {
	var builder strings.Builder
	builder.WriteString("You are participating inside OpenShock as a visible agent in the current conversation.\n")
	builder.WriteString("Reply in concise Chinese.\n")
	builder.WriteString("Messages with or without @mention use the same reasoning flow. @mention is only a stronger explicit signal in the input context, not a separate workflow.\n")
	builder.WriteString("Decision order:\n")
	builder.WriteString("1. First decide whether this message needs your reply.\n")
	builder.WriteString("2. If you reply, the first visible response must be natural language, like a teammate speaking in chat.\n")
	builder.WriteString("3. While replying, also analyze whether the conversation should later converge into a task. Do not default to task-taking, task-assignment, task-creation, or workflow wording.\n")
	builder.WriteString("Return exactly this format:\n")
	builder.WriteString("KIND: <message|clarification_request|handoff|summary|no_response>\n")
	builder.WriteString("BODY:\n")
	builder.WriteString("<your message>\n")
	builder.WriteString("Use message for an ordinary conversational reply.\n")
	builder.WriteString("If you choose clarification_request, ask only the blocking question.\n")
	builder.WriteString("If you choose handoff, mention the target agent in BODY with @agent_id.\n")
	builder.WriteString("Use summary only for a concise wrap-up or status note after understanding the context.\n")
	builder.WriteString("Use no_response only when this visible message does not need a reply from you.\n")
	builder.WriteString("Do not mention internal implementation details.\n")
	builder.WriteString("Signal summary: ")
	builder.WriteString(describeTurnSignal(execution))
	builder.WriteString("\n")
	builder.WriteString("Visible target: ")
	if target := strings.TrimSpace(execution.Turn.EventFrame.CurrentTarget); target != "" {
		builder.WriteString(target)
	} else {
		builder.WriteString("room:")
		builder.WriteString(execution.Turn.RoomID)
	}
	builder.WriteString("\n")
	builder.WriteString("Room title: ")
	builder.WriteString(execution.Room.Title)
	builder.WriteString("\n")
	builder.WriteString("Current agent: ")
	builder.WriteString(execution.Turn.AgentID)
	builder.WriteString("\n")
	if mentions := extractMentionSignals(execution.TriggerMessage.Body); len(mentions) > 0 {
		builder.WriteString("Mention signals in trigger: ")
		builder.WriteString(strings.Join(mentions, ", "))
		builder.WriteString("\n")
	}
	if summary := strings.TrimSpace(execution.Turn.EventFrame.ContextSummary); summary != "" {
		builder.WriteString("Context summary: ")
		builder.WriteString(summary)
		builder.WriteString("\n")
	}
	if summary := strings.TrimSpace(execution.Turn.EventFrame.RecentMessagesSummary); summary != "" {
		builder.WriteString("Recent summary: ")
		builder.WriteString(summary)
		builder.WriteString("\n")
	}
	builder.WriteString("Trigger message:\n")
	builder.WriteString(execution.TriggerMessage.ActorName)
	builder.WriteString(": ")
	builder.WriteString(execution.TriggerMessage.Body)
	builder.WriteString("\n\nRecent room context:\n")
	for _, message := range execution.Messages {
		builder.WriteString("- ")
		builder.WriteString(message.ActorName)
		builder.WriteString(" [")
		builder.WriteString(message.Kind)
		builder.WriteString("]: ")
		builder.WriteString(message.Body)
		builder.WriteString("\n")
	}
	return builder.String()
}

type agentTurnReply struct {
	Kind string
	Body string
}

func parseAgentTurnReply(raw string) agentTurnReply {
	text := strings.TrimSpace(raw)
	if text == "" {
		return agentTurnReply{Kind: "message", Body: ""}
	}

	reply := agentTurnReply{Kind: "message", Body: text}
	lines := strings.Split(text, "\n")
	bodyStart := -1
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		lower := strings.ToLower(trimmed)
		if strings.HasPrefix(lower, "kind:") {
			if kind := normalizeAgentReplyKind(strings.TrimSpace(trimmed[len("kind:"):])); kind != "" {
				reply.Kind = kind
			}
			continue
		}
		if strings.EqualFold(trimmed, "body:") {
			bodyStart = i + 1
			break
		}
	}

	if bodyStart >= 0 && bodyStart <= len(lines) {
		reply.Body = strings.TrimSpace(strings.Join(lines[bodyStart:], "\n"))
	}
	return reply
}

func normalizeAgentReplyKind(kind string) string {
	switch strings.ToLower(strings.TrimSpace(kind)) {
	case "message", "clarification_request", "handoff", "summary", "no_response":
		return strings.ToLower(strings.TrimSpace(kind))
	default:
		return ""
	}
}

func describeTurnSignal(execution client.AgentTurnExecution) string {
	switch strings.TrimSpace(execution.Turn.IntentType) {
	case "clarification_followup":
		return "human follow-up after an earlier clarification"
	case "handoff_response":
		return "another agent explicitly asked you to take over"
	case "visible_message_response":
		if mentions := extractMentionSignals(execution.TriggerMessage.Body); len(mentions) > 0 {
			return "ordinary visible message with explicit mention signal"
		}
		return "ordinary visible room message"
	default:
		if signal := strings.TrimSpace(execution.Turn.EventFrame.ExpectedAction); signal != "" {
			return signal
		}
		return "ordinary visible message"
	}
}

func extractMentionSignals(body string) []string {
	seen := make(map[string]struct{})
	mentions := make([]string, 0, 2)
	for _, token := range strings.Fields(body) {
		if !strings.HasPrefix(token, "@") {
			continue
		}
		cleaned := strings.Trim(token, " \t\r\n,.;:!?()[]{}<>\"'，。；：！？、")
		if cleaned == "" || cleaned == "@" {
			continue
		}
		if _, ok := seen[cleaned]; ok {
			continue
		}
		seen[cleaned] = struct{}{}
		mentions = append(mentions, cleaned)
	}
	return mentions
}

func actionEntityID(resp client.ActionResponse, entityType string) string {
	for _, entity := range resp.AffectedEntities {
		if entity.Type == entityType {
			return entity.ID
		}
	}
	return ""
}

func buildRunCommitMessage(run client.Run) string {
	title := strings.TrimSpace(run.Title)
	if title == "" {
		title = run.TaskID
	}
	return "OpenShock: " + title
}
