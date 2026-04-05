package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type workspaceSnapshot struct {
	Name          string `json:"name"`
	Repo          string `json:"repo"`
	DefaultBranch string `json:"defaultBranch"`
	MemoryMode    string `json:"memoryMode"`
	Runtime       string `json:"runtime"`
}

type issue struct {
	Key      string `json:"key"`
	Title    string `json:"title"`
	State    string `json:"state"`
	Owner    string `json:"owner"`
	RoomID   string `json:"roomId"`
	RunID    string `json:"runId"`
	Priority string `json:"priority"`
}

type run struct {
	ID         string `json:"id"`
	IssueKey   string `json:"issueKey"`
	Status     string `json:"status"`
	Runtime    string `json:"runtime"`
	Branch     string `json:"branch"`
	Worktree   string `json:"worktree"`
	Owner      string `json:"owner"`
	NextAction string `json:"nextAction"`
}

type room struct {
	ID       string `json:"id"`
	IssueKey string `json:"issueKey"`
	Title    string `json:"title"`
	Summary  string `json:"summary"`
	RunID    string `json:"runId"`
}

type channel struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Summary string `json:"summary"`
}

type agent struct {
	ID                string   `json:"id"`
	Name              string   `json:"name"`
	Provider          string   `json:"provider"`
	RuntimePreference string   `json:"runtimePreference"`
	State             string   `json:"state"`
	MemorySpaces      []string `json:"memorySpaces"`
}

type inboxItem struct {
	ID      string `json:"id"`
	Kind    string `json:"kind"`
	Title   string `json:"title"`
	Summary string `json:"summary"`
	Href    string `json:"href"`
}

type runtimeSnapshot struct {
	Machine       string           `json:"machine"`
	DetectedCLI   []string         `json:"detectedCli"`
	Providers     []map[string]any `json:"providers"`
	State         string           `json:"state"`
	WorkspaceRoot string           `json:"workspaceRoot"`
	ReportedAt    string           `json:"reportedAt"`
}

type execRequest struct {
	Provider string `json:"provider"`
	Prompt   string `json:"prompt"`
	Cwd      string `json:"cwd"`
}

type apiState struct {
	Workspace workspaceSnapshot `json:"workspace"`
	Channels  []channel         `json:"channels"`
	Rooms     []room            `json:"rooms"`
	Issues    []issue           `json:"issues"`
	Runs      []run             `json:"runs"`
	Agents    []agent           `json:"agents"`
	Inbox     []inboxItem       `json:"inbox"`
}

func main() {
	addr := envOr("OPENSHOCK_SERVER_ADDR", ":8080")
	daemonURL := strings.TrimRight(envOr("OPENSHOCK_DAEMON_URL", "http://127.0.0.1:8090"), "/")
	state := seedState()
	httpClient := &http.Client{Timeout: 4 * time.Minute}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"ok":        true,
			"service":   "openshock-server",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})
	mux.HandleFunc("/v1/workspace", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, state.Workspace)
	})
	mux.HandleFunc("/v1/channels", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, state.Channels)
	})
	mux.HandleFunc("/v1/rooms", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, state.Rooms)
	})
	mux.HandleFunc("/v1/issues", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, state.Issues)
	})
	mux.HandleFunc("/v1/runs", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/v1/runs" {
			writeJSON(w, http.StatusOK, state.Runs)
			return
		}

		runID := strings.TrimPrefix(r.URL.Path, "/v1/runs/")
		for _, candidate := range state.Runs {
			if candidate.ID == runID {
				writeJSON(w, http.StatusOK, candidate)
				return
			}
		}

		writeJSON(w, http.StatusNotFound, map[string]string{"error": "run not found"})
	})
	mux.HandleFunc("/v1/agents", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, state.Agents)
	})
	mux.HandleFunc("/v1/inbox", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, state.Inbox)
	})
	mux.HandleFunc("/v1/runtime", func(w http.ResponseWriter, _ *http.Request) {
		forwardGetJSON(w, httpClient, daemonURL+"/v1/runtime")
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

		body, _ := json.Marshal(req)
		request, err := http.NewRequest(http.MethodPost, daemonURL+"/v1/exec", bytes.NewReader(body))
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		request.Header.Set("Content-Type", "application/json")

		response, err := httpClient.Do(request)
		if err != nil {
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
			return
		}
		defer response.Body.Close()

		copyJSON(w, response.StatusCode, response.Body)
	})

	log.Printf("openshock-server listening on %s (daemon %s)", addr, daemonURL)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func seedState() apiState {
	return apiState{
		Workspace: workspaceSnapshot{
			Name:          "Electric Architect",
			Repo:          "Larkspur-Wang/OpenShock",
			DefaultBranch: "main",
			MemoryMode:    "MEMORY.md + notes/ + decisions/",
			Runtime:       "shock-main",
		},
		Channels: []channel{
			{ID: "all", Name: "#all", Summary: "Lounge for fast coordination and rough product truth."},
			{ID: "roadmap", Name: "#roadmap", Summary: "Direction setting, sequencing, and product arguments."},
			{ID: "announcements", Name: "#announcements", Summary: "Low-noise launch and runtime updates."},
		},
		Rooms: []room{
			{ID: "room-runtime", IssueKey: "OPS-12", Title: "Open runtime heartbeat", Summary: "Bring runtime status and run truth into one room.", RunID: "run_runtime_01"},
			{ID: "room-inbox", IssueKey: "OPS-19", Title: "Inbox decision center", Summary: "Unify blocked, approval, and review prompts.", RunID: "run_inbox_01"},
			{ID: "room-memory", IssueKey: "OPS-27", Title: "Memory file writer", Summary: "Keep file memory inspectable and reversible.", RunID: "run_memory_01"},
		},
		Issues: []issue{
			{Key: "OPS-12", Title: "Open runtime heartbeat and machine presence", State: "running", Owner: "Codex Dockmaster", RoomID: "room-runtime", RunID: "run_runtime_01", Priority: "critical"},
			{Key: "OPS-19", Title: "Build the inbox decision center", State: "review", Owner: "Claude Review Runner", RoomID: "room-inbox", RunID: "run_inbox_01", Priority: "high"},
			{Key: "OPS-27", Title: "Ship workspace file memory writeback", State: "blocked", Owner: "Memory Clerk", RoomID: "room-memory", RunID: "run_memory_01", Priority: "high"},
		},
		Runs: []run{
			{ID: "run_runtime_01", IssueKey: "OPS-12", Status: "running", Runtime: "shock-main", Branch: "feat/runtime-state-shell", Worktree: "wt-runtime-shell", Owner: "Codex Dockmaster", NextAction: "Open PR when visual review passes"},
			{ID: "run_inbox_01", IssueKey: "OPS-19", Status: "review", Runtime: "shock-sidecar", Branch: "feat/inbox-decision-cards", Worktree: "wt-inbox-cards", Owner: "Claude Review Runner", NextAction: "Human review on tone and notification defaults"},
			{ID: "run_memory_01", IssueKey: "OPS-27", Status: "blocked", Runtime: "shock-main", Branch: "feat/memory-writeback", Worktree: "wt-memory-writeback", Owner: "Memory Clerk", NextAction: "Resolve precedence rule before writeback"},
		},
		Agents: []agent{
			{ID: "agent-codex-dockmaster", Name: "Codex Dockmaster", Provider: "codex", RuntimePreference: "shock-main", State: "running", MemorySpaces: []string{"workspace", "issue-room", "topic"}},
			{ID: "agent-claude-review-runner", Name: "Claude Review Runner", Provider: "claude", RuntimePreference: "shock-sidecar", State: "idle", MemorySpaces: []string{"workspace", "issue-room"}},
			{ID: "agent-memory-clerk", Name: "Memory Clerk", Provider: "codex", RuntimePreference: "shock-main", State: "blocked", MemorySpaces: []string{"workspace", "user", "room-notes"}},
		},
		Inbox: []inboxItem{
			{ID: "inbox-approval-runtime", Kind: "approval", Title: "Approval required for destructive git cleanup", Summary: "Run asked to prune an obsolete branch after visual review passes.", Href: "/rooms/room-runtime/runs/run_runtime_01"},
			{ID: "inbox-blocked-memory", Kind: "blocked", Title: "Memory Clerk is blocked on scope priority", Summary: "Need a precedence rule before memory writeback can continue.", Href: "/rooms/room-memory/runs/run_memory_01"},
			{ID: "inbox-review-copy", Kind: "review", Title: "Inbox decision center is ready for review", Summary: "Final copy and route links are waiting for product review.", Href: "/rooms/room-inbox/runs/run_inbox_01"},
		},
	}
}

func forwardGetJSON(w http.ResponseWriter, client *http.Client, url string) {
	response, err := client.Get(url)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}
	defer response.Body.Close()

	copyJSON(w, response.StatusCode, response.Body)
}

func copyJSON(w http.ResponseWriter, status int, reader io.Reader) {
	body, err := io.ReadAll(reader)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(body)
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
