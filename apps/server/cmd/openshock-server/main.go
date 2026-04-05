package main

import (
	"encoding/json"
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
	ID        string `json:"id"`
	IssueKey  string `json:"issueKey"`
	Status    string `json:"status"`
	Runtime   string `json:"runtime"`
	Branch    string `json:"branch"`
	Worktree  string `json:"worktree"`
	Owner     string `json:"owner"`
	NextAction string `json:"nextAction"`
}

type apiState struct {
	Workspace workspaceSnapshot `json:"workspace"`
	Issues    []issue           `json:"issues"`
	Runs      []run             `json:"runs"`
}

func main() {
	addr := envOr("OPENSHOCK_SERVER_ADDR", ":8080")
	state := seedState()

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

	log.Printf("openshock-server listening on %s", addr)
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
		Issues: []issue{
			{
				Key:      "OPS-12",
				Title:    "Open runtime heartbeat and machine presence",
				State:    "running",
				Owner:    "Codex Dockmaster",
				RoomID:   "room-runtime",
				RunID:    "run_runtime_01",
				Priority: "critical",
			},
			{
				Key:      "OPS-19",
				Title:    "Build the inbox decision center",
				State:    "review",
				Owner:    "Claude Review Runner",
				RoomID:   "room-inbox",
				RunID:    "run_inbox_01",
				Priority: "high",
			},
		},
		Runs: []run{
			{
				ID:         "run_runtime_01",
				IssueKey:   "OPS-12",
				Status:     "running",
				Runtime:    "shock-main",
				Branch:     "feat/runtime-state-shell",
				Worktree:   "wt-runtime-shell",
				Owner:      "Codex Dockmaster",
				NextAction: "Open PR when visual review passes",
			},
			{
				ID:         "run_inbox_01",
				IssueKey:   "OPS-19",
				Status:     "review",
				Runtime:    "shock-sidecar",
				Branch:     "feat/inbox-decision-cards",
				Worktree:   "wt-inbox-cards",
				Owner:      "Claude Review Runner",
				NextAction: "Human review on tone and notification defaults",
			},
		},
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
