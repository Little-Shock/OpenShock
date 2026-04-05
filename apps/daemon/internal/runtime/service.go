package runtime

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"strings"
	"time"
)

type Heartbeat struct {
	Machine       string     `json:"machine"`
	DetectedCLI   []string   `json:"detectedCli"`
	Providers     []Provider `json:"providers"`
	State         string     `json:"state"`
	WorkspaceRoot string     `json:"workspaceRoot"`
	ReportedAt    string     `json:"reportedAt"`
}

type Provider struct {
	ID           string   `json:"id"`
	Label        string   `json:"label"`
	Mode         string   `json:"mode"`
	Capabilities []string `json:"capabilities"`
	Transport    string   `json:"transport"`
}

type ExecRequest struct {
	Provider string `json:"provider"`
	Prompt   string `json:"prompt"`
	Cwd      string `json:"cwd"`
}

type ExecResponse struct {
	Provider string   `json:"provider"`
	Command  []string `json:"command"`
	Output   string   `json:"output"`
	Error    string   `json:"error,omitempty"`
	Duration string   `json:"duration"`
}

type Service struct {
	machine string
	root    string
}

type execPlan struct {
	command     []string
	outputFile  string
	cleanupFile bool
}

func NewService(machine, root string) *Service {
	return &Service{machine: machine, root: root}
}

func (s *Service) Snapshot() Heartbeat {
	return Heartbeat{
		Machine:       s.machine,
		DetectedCLI:   detectCLI(),
		Providers:     detectProviders(),
		State:         "online",
		WorkspaceRoot: s.root,
		ReportedAt:    time.Now().UTC().Format(time.RFC3339),
	}
}

func (s *Service) RunPrompt(req ExecRequest) (ExecResponse, error) {
	startedAt := time.Now()
	plan, err := buildCommand(req)
	if err != nil {
		return ExecResponse{Provider: req.Provider}, err
	}
	if plan.cleanupFile {
		defer os.Remove(plan.outputFile)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, plan.command[0], plan.command[1:]...)
	cmd.Dir = req.Cwd
	cmd.Env = os.Environ()

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	output := strings.TrimSpace(stdout.String())
	if output == "" {
		output = strings.TrimSpace(stderr.String())
	}
	if plan.outputFile != "" {
		if contentBytes, readErr := os.ReadFile(plan.outputFile); readErr == nil {
			fileOutput := strings.TrimSpace(string(contentBytes))
			if fileOutput != "" {
				output = fileOutput
			}
		}
	}

	resp := ExecResponse{
		Provider: req.Provider,
		Command:  plan.command,
		Output:   output,
		Duration: time.Since(startedAt).Round(time.Millisecond).String(),
	}

	if ctx.Err() == context.DeadlineExceeded {
		return resp, context.DeadlineExceeded
	}
	if err != nil {
		if stderr.Len() > 0 {
			resp.Error = strings.TrimSpace(stderr.String())
		}
		return resp, err
	}
	return resp, nil
}

func detectCLI() []string {
	candidates := []string{"codex", "claude", "claude-code"}
	detected := make([]string, 0, len(candidates))
	for _, candidate := range candidates {
		if _, err := exec.LookPath(candidate); err == nil {
			detected = append(detected, candidate)
		}
	}
	if len(detected) == 0 {
		return []string{"none-detected"}
	}
	return detected
}

func detectProviders() []Provider {
	providers := make([]Provider, 0, 2)
	if _, err := exec.LookPath("codex"); err == nil {
		providers = append(providers, Provider{
			ID:    "codex",
			Label: "Codex CLI",
			Mode:  "direct-cli",
			Capabilities: []string{
				"conversation",
				"non-interactive-exec",
				"mcp-server",
				"app-server",
			},
			Transport: "http bridge",
		})
	}
	if _, err := exec.LookPath("claude"); err == nil {
		providers = append(providers, Provider{
			ID:    "claude",
			Label: "Claude Code CLI",
			Mode:  "direct-cli",
			Capabilities: []string{
				"conversation",
				"non-interactive-print",
				"mcp-config",
			},
			Transport: "http bridge",
		})
	}
	return providers
}

func buildCommand(req ExecRequest) (execPlan, error) {
	switch strings.ToLower(strings.TrimSpace(req.Provider)) {
	case "claude":
		return execPlan{
			command: []string{
				"claude", "--bare", "-p", req.Prompt,
				"--output-format", "text",
				"--permission-mode", "bypassPermissions",
				"--no-session-persistence",
				"--add-dir", req.Cwd,
			},
		}, nil
	default:
		outputFile, err := os.CreateTemp("", "openshock-codex-last-*.txt")
		if err != nil {
			return execPlan{}, err
		}
		_ = outputFile.Close()
		return execPlan{
			command: []string{
				"codex", "exec", req.Prompt,
				"--skip-git-repo-check",
				"--sandbox", "read-only",
				"-C", req.Cwd,
				"--output-last-message", outputFile.Name(),
			},
			outputFile:  outputFile.Name(),
			cleanupFile: true,
		}, nil
	}
}
