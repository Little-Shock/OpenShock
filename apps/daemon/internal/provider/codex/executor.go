package codex

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"openshock/daemon/internal/acp"
	"openshock/daemon/internal/provider"
)

type Executor struct{}

func NewExecutor() *Executor {
	return &Executor{}
}

func (e *Executor) Execute(ctx context.Context, req provider.ExecuteRequest, handle func(acp.Event) error) (provider.ExecuteResult, error) {
	if strings.TrimSpace(req.RepoPath) == "" {
		return provider.ExecuteResult{}, errors.New("repoPath is required")
	}
	if strings.TrimSpace(req.Instruction) == "" {
		return provider.ExecuteResult{}, errors.New("instruction is required")
	}

	bin := strings.TrimSpace(req.CodexBinPath)
	if bin == "" {
		bin = "codex"
	}

	outputFile := filepath.Join(req.RepoPath, ".openshock_codex_last_message.txt")
	defer os.Remove(outputFile)
	sandboxMode := strings.TrimSpace(req.SandboxMode)
	if sandboxMode == "" {
		sandboxMode = "danger-full-access"
	}
	args := []string{
		"exec",
		"--json",
		"--skip-git-repo-check",
		"--sandbox", sandboxMode,
		"-C", req.RepoPath,
		"-o", outputFile,
		req.Instruction,
	}

	cmd := exec.CommandContext(ctx, bin, args...)
	cmd.Dir = req.RepoPath
	cmd.Env = append(os.Environ(), "OTEL_SDK_DISABLED=true")
	if codexHome := strings.TrimSpace(req.CodexHome); codexHome != "" {
		cmd.Env = append(cmd.Env, "CODEX_HOME="+codexHome)
	}

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return provider.ExecuteResult{}, err
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return provider.ExecuteResult{}, err
	}

	if err := cmd.Start(); err != nil {
		return provider.ExecuteResult{}, err
	}

	var rawOutputMu sync.Mutex
	var rawOutput strings.Builder
	appendRaw := func(line string) {
		rawOutputMu.Lock()
		defer rawOutputMu.Unlock()
		rawOutput.WriteString(line)
		if !strings.HasSuffix(line, "\n") {
			rawOutput.WriteString("\n")
		}
	}

	var readErrMu sync.Mutex
	var readErr error
	setErr := func(err error) {
		if err == nil {
			return
		}
		readErrMu.Lock()
		defer readErrMu.Unlock()
		if readErr == nil {
			readErr = err
		}
	}

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			line := scanner.Text()
			appendRaw(line)
			for _, event := range parseACPEvents(line) {
				if handle != nil {
					if err := handle(event); err != nil {
						setErr(err)
						return
					}
				}
			}
		}
		setErr(normalizeScannerErr(scanner.Err()))
	}()

	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			line := scanner.Text()
			appendRaw(line)
			if isIgnorableCodexLogLine(line) {
				continue
			}
			if handle != nil {
				if err := handle(acp.Event{Kind: acp.EventStderrChunk, Content: line, Stream: "stderr"}); err != nil {
					setErr(err)
					return
				}
			}
		}
		setErr(normalizeScannerErr(scanner.Err()))
	}()

	waitErr := cmd.Wait()
	wg.Wait()

	readErrMu.Lock()
	defer readErrMu.Unlock()

	result := provider.ExecuteResult{
		RawOutput: strings.TrimSpace(rawOutput.String()),
	}
	lastMessageBytes, err := os.ReadFile(outputFile)
	if err == nil {
		result.LastMessage = strings.TrimSpace(string(lastMessageBytes))
		if handle != nil && result.LastMessage != "" {
			if handleErr := handle(acp.Event{Kind: acp.EventCompleted, LastMessage: result.LastMessage}); handleErr != nil && readErr == nil {
				readErr = handleErr
			}
		}
	}

	if readErr != nil {
		return result, readErr
	}
	if waitErr != nil {
		return result, waitErr
	}
	return result, nil
}

func (e *Executor) Close() error {
	return nil
}

type codexJSONEvent struct {
	Type        string          `json:"type"`
	Content     string          `json:"content"`
	Text        string          `json:"text"`
	Delta       string          `json:"delta"`
	Message     string          `json:"message"`
	LastMessage string          `json:"lastMessage"`
	ToolName    string          `json:"toolName"`
	Arguments   string          `json:"arguments"`
	Status      string          `json:"status"`
	Item        *codexJSONItem  `json:"item"`
	Error       *codexJSONError `json:"error"`
}

type codexJSONItem struct {
	ID               string `json:"id"`
	Type             string `json:"type"`
	Text             string `json:"text"`
	Command          string `json:"command"`
	AggregatedOutput string `json:"aggregated_output"`
	Status           string `json:"status"`
	Name             string `json:"name"`
	Arguments        string `json:"arguments"`
}

type codexJSONError struct {
	Message string `json:"message"`
}

func parseACPEvents(line string) []acp.Event {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return nil
	}

	var event codexJSONEvent
	if err := json.Unmarshal([]byte(trimmed), &event); err != nil {
		return nil
	}

	switch event.Type {
	case "acp.stdout", "stdout", "output_text.delta", "response.output_text.delta":
		return []acp.Event{{
			Kind:    acp.EventStdoutChunk,
			Content: firstNonEmpty(event.Content, event.Text, event.Delta),
			Stream:  "stdout",
		}}
	case "acp.stderr", "stderr":
		return []acp.Event{{
			Kind:    acp.EventStderrChunk,
			Content: firstNonEmpty(event.Content, event.Text, event.Delta),
			Stream:  "stderr",
		}}
	case "acp.tool_call", "tool_call":
		return []acp.Event{{
			Kind: acp.EventToolCall,
			ToolCall: &acp.ToolCall{
				ToolName:  event.ToolName,
				Arguments: event.Arguments,
				Status:    firstNonEmpty(event.Status, "completed"),
			},
		}}
	case "acp.completed", "completed":
		return []acp.Event{{Kind: acp.EventCompleted, LastMessage: firstNonEmpty(event.LastMessage, event.Content, event.Text)}}
	case "item.started", "item.completed":
		return parseACPItemEvent(event.Item)
	case "response.output_item.added", "response.output_item.done":
		return parseACPItemEvent(event.Item)
	case "error", "turn.failed":
		message := firstNonEmpty(event.Message)
		if event.Error != nil {
			message = firstNonEmpty(event.Error.Message, message)
		}
		if message == "" {
			return nil
		}
		return []acp.Event{{Kind: acp.EventStderrChunk, Content: message, Stream: "stderr"}}
	default:
		content := firstNonEmpty(event.Content, event.Text, event.Delta)
		if content == "" {
			return nil
		}
		return []acp.Event{{Kind: acp.EventStdoutChunk, Content: content, Stream: "stdout"}}
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func normalizeScannerErr(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, os.ErrClosed) {
		return nil
	}
	return err
}

func isIgnorableCodexLogLine(line string) bool {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return true
	}
	if trimmed == "Reading additional input from stdin..." {
		return true
	}
	if strings.Contains(trimmed, " WARN codex_") || strings.Contains(trimmed, " INFO codex_") {
		return true
	}
	return false
}

func parseACPItemEvent(item *codexJSONItem) []acp.Event {
	if item == nil {
		return nil
	}

	switch item.Type {
	case "agent_message":
		content := strings.TrimSpace(item.Text)
		if content == "" {
			return nil
		}
		return []acp.Event{{
			Kind:    acp.EventStdoutChunk,
			Content: content,
			Stream:  "session",
		}}
	case "command_execution":
		return []acp.Event{{
			Kind: acp.EventToolCall,
			ToolCall: &acp.ToolCall{
				ToolName:  "shell",
				Arguments: item.Command,
				Status:    normalizedACPStatus(item.Status),
			},
		}}
	case "function_call":
		return []acp.Event{{
			Kind: acp.EventToolCall,
			ToolCall: &acp.ToolCall{
				ToolName:  item.Name,
				Arguments: item.Arguments,
				Status:    normalizedACPStatus(item.Status),
			},
		}}
	default:
		return nil
	}
}

func normalizedACPStatus(value string) string {
	status := strings.TrimSpace(value)
	if status == "" {
		return "completed"
	}
	return status
}
