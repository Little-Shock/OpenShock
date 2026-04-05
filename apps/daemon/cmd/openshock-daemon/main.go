package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type heartbeat struct {
	Machine       string     `json:"machine"`
	DetectedCLI   []string   `json:"detectedCli"`
	Providers     []provider `json:"providers"`
	State         string     `json:"state"`
	WorkspaceRoot string     `json:"workspaceRoot"`
	ReportedAt    string     `json:"reportedAt"`
}

type provider struct {
	ID           string   `json:"id"`
	Label        string   `json:"label"`
	Mode         string   `json:"mode"`
	Capabilities []string `json:"capabilities"`
	Transport    string   `json:"transport"`
}

type execRequest struct {
	Provider string `json:"provider"`
	Prompt   string `json:"prompt"`
	Cwd      string `json:"cwd"`
}

type execResponse struct {
	Provider string   `json:"provider"`
	Command  []string `json:"command"`
	Output   string   `json:"output"`
	Error    string   `json:"error,omitempty"`
	Duration string   `json:"duration"`
}

type execPlan struct {
	command     []string
	outputFile  string
	cleanupFile bool
}

func main() {
	once := flag.Bool("once", false, "print one heartbeat and exit")
	machine := flag.String("machine-name", "shock-main", "machine name reported to OpenShock")
	workspaceRoot := flag.String("workspace-root", ".", "workspace root for local runtime discovery")
	addr := flag.String("addr", envOr("OPENSHOCK_DAEMON_ADDR", ":8090"), "http listen address")
	flag.Parse()

	root, err := filepath.Abs(*workspaceRoot)
	if err != nil {
		log.Fatal(err)
	}

	if *once {
		printHeartbeat(*machine, root)
		return
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":        true,
			"service":   "openshock-daemon",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})
	mux.HandleFunc("/v1/runtime", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, snapshot(*machine, root))
	})
	mux.HandleFunc("/v1/exec", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}

		var req execRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json body"})
			return
		}

		if strings.TrimSpace(req.Prompt) == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "prompt is required"})
			return
		}

		if strings.TrimSpace(req.Cwd) == "" {
			req.Cwd = root
		}

		resp, err := runPrompt(req)
		if err != nil {
			resp.Error = err.Error()
			writeJSON(w, http.StatusBadGateway, resp)
			return
		}

		writeJSON(w, http.StatusOK, resp)
	})

	log.Printf("openshock-daemon listening on %s for %s", *addr, root)
	if err := http.ListenAndServe(*addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func printHeartbeat(machine, workspaceRoot string) {
	bytes, err := json.Marshal(snapshot(machine, workspaceRoot))
	if err != nil {
		log.Printf("failed to marshal heartbeat: %v", err)
		return
	}

	log.Println(string(bytes))
}

func snapshot(machine, workspaceRoot string) heartbeat {
	return heartbeat{
		Machine:       machine,
		DetectedCLI:   detectCLI(),
		Providers:     detectProviders(),
		State:         "online",
		WorkspaceRoot: workspaceRoot,
		ReportedAt:    time.Now().UTC().Format(time.RFC3339),
	}
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

func detectProviders() []provider {
	providers := make([]provider, 0, 2)

	if _, err := exec.LookPath("codex"); err == nil {
		providers = append(providers, provider{
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
		providers = append(providers, provider{
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

func runPrompt(req execRequest) (execResponse, error) {
	startedAt := time.Now()
	plan, err := buildCommand(req)
	if err != nil {
		return execResponse{Provider: req.Provider}, err
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

	resp := execResponse{
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

func buildCommand(req execRequest) (execPlan, error) {
	switch strings.ToLower(strings.TrimSpace(req.Provider)) {
	case "claude":
		return execPlan{
			command: []string{
				"claude",
				"--bare",
				"-p",
				req.Prompt,
				"--output-format",
				"text",
				"--permission-mode",
				"bypassPermissions",
				"--no-session-persistence",
				"--add-dir",
				req.Cwd,
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
				"codex",
				"exec",
				req.Prompt,
				"--skip-git-repo-check",
				"--sandbox",
				"read-only",
				"-C",
				req.Cwd,
				"--output-last-message",
				outputFile.Name(),
			},
			outputFile:  outputFile.Name(),
			cleanupFile: true,
		}, nil
	}
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
