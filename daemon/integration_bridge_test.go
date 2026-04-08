package daemon

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

type captureServer struct {
	mu sync.Mutex

	runtimeConfigCalls int
	seedCalls          int
	smokeCalls         int
	daemonEvents       []RuntimeDaemonEventRequest
	authorizations     []string
}

func (s *captureServer) handler(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.authorizations = append(s.authorizations, r.Header.Get("Authorization"))
	switch r.URL.Path {
	case "/runtime/config":
		s.runtimeConfigCalls++
		writeJSON(w, http.StatusOK, RuntimeConfigResponse{
			RuntimeName: "integration-runtime",
			ServerPort:  4315,
			SampleFixture: SampleFixtureInfo{
				TopicID: "topic_fixture_seeded",
			},
			Endpoints: map[string]string{
				"daemonEvents": "/runtime/daemon/events",
			},
		})
		return
	case "/runtime/fixtures/seed":
		s.seedCalls++
		writeJSON(w, http.StatusOK, RuntimeSeedResponse{
			TopicCreated: true,
			AgentCount:   3,
		})
		return
	case "/runtime/smoke":
		s.smokeCalls++
		writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
			SampleTopicReady:      true,
			SampleTopicAgentCount: 3,
		})
		return
	case "/runtime/daemon/events":
		var payload RuntimeDaemonEventRequest
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(err.Error()))
			return
		}
		if payload.TopicID != "topic_fixture_seeded" {
			writeJSON(w, http.StatusBadRequest, map[string]any{
				"error":   "topic_not_found",
				"message": "topic " + payload.TopicID + " not found",
			})
			return
		}
		if payload.Type == DaemonEventStatusReport {
			body, ok := payload.Payload.(map[string]any)
			if !ok {
				writeJSON(w, http.StatusBadRequest, map[string]any{
					"error":   "status_event_required",
					"message": "status_report payload.event is required",
				})
				return
			}
			eventName, _ := body["event"].(string)
			if strings.TrimSpace(eventName) == "" {
				writeJSON(w, http.StatusBadRequest, map[string]any{
					"error":   "status_event_required",
					"message": "status_report payload.event is required",
				})
				return
			}
		}
		s.daemonEvents = append(s.daemonEvents, payload)
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func TestLoadSharedRuntimeConfigResolvesRelativePaths(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	configPath := filepath.Join(root, "runtime", "shared-runtime-config.json")
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	payload := `{
  "workspace_id":"ws_test",
  "runtime_id":"runtime_test",
  "server":{"base_url":"http://127.0.0.1:8080"},
  "daemon":{"state_path":"data/state.json","ack_path":"data/ack.json","worktree_root":"data/worktrees","publish_cursor_path":"data/cursor.json"}
}`
	if err := os.WriteFile(configPath, []byte(payload), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := LoadSharedRuntimeConfig(configPath)
	if err != nil {
		t.Fatalf("load shared config: %v", err)
	}
	if !filepath.IsAbs(cfg.Daemon.StatePath) || !filepath.IsAbs(cfg.Daemon.PublishCursorPath) {
		t.Fatalf("expected resolved absolute daemon paths")
	}
	if cfg.Server.RuntimeConfigPath != "/runtime/config" {
		t.Fatalf("expected default runtime config path, got %q", cfg.Server.RuntimeConfigPath)
	}
	if cfg.Server.FixtureSeedPath != "/runtime/fixtures/seed" {
		t.Fatalf("expected default seed path, got %q", cfg.Server.FixtureSeedPath)
	}
	if cfg.Server.DaemonEventsPath != "/runtime/daemon/events" {
		t.Fatalf("expected default daemon events path, got %q", cfg.Server.DaemonEventsPath)
	}
	if cfg.Server.RuntimeSmokePath != "/runtime/smoke" {
		t.Fatalf("expected default smoke path, got %q", cfg.Server.RuntimeSmokePath)
	}
}

func TestIntegratedDaemonPublishesRunFeedbackAndHold(t *testing.T) {
	t.Parallel()

	capture := &captureServer{}
	testServer := httptest.NewServer(http.HandlerFunc(capture.handler))
	defer testServer.Close()

	root := t.TempDir()
	configPath := filepath.Join(root, "runtime", "shared-runtime-config.json")
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	payload := `{
  "workspace_id":"ws_test",
  "runtime_id":"runtime_test",
  "server":{"base_url":"` + testServer.URL + `","api_token":"token123"},
  "daemon":{"state_path":"data/state.json","ack_path":"data/ack.json","worktree_root":"data/worktrees","publish_cursor_path":"data/cursor.json"}
}`
	if err := os.WriteFile(configPath, []byte(payload), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := LoadSharedRuntimeConfig(configPath)
	if err != nil {
		t.Fatalf("load shared config: %v", err)
	}
	integrated, err := NewIntegratedDaemon(cfg)
	if err != nil {
		t.Fatalf("new integrated daemon: %v", err)
	}

	lane, run, published, err := integrated.IntegratedDemo(context.Background(), "ISSUE-DEMO", "")
	if err != nil {
		t.Fatalf("integrated demo: %v", err)
	}
	if lane.ID == "" || run.ID == "" {
		t.Fatalf("expected non-empty lane/run ids")
	}
	if lane.TopicID != "topic_fixture_seeded" {
		t.Fatalf("expected demo to fallback to sample fixture topic, got %q", lane.TopicID)
	}
	if published == 0 {
		t.Fatalf("expected published events")
	}

	capture.mu.Lock()
	if capture.runtimeConfigCalls != 1 {
		capture.mu.Unlock()
		t.Fatalf("expected one runtime config call, got %d", capture.runtimeConfigCalls)
	}
	if capture.seedCalls != 1 {
		capture.mu.Unlock()
		t.Fatalf("expected one fixture seed call, got %d", capture.seedCalls)
	}
	if capture.smokeCalls != runtimeReadyStableChecks {
		capture.mu.Unlock()
		t.Fatalf("expected %d smoke calls, got %d", runtimeReadyStableChecks, capture.smokeCalls)
	}
	if len(capture.authorizations) == 0 {
		capture.mu.Unlock()
		t.Fatalf("expected authorization headers")
	}
	for _, header := range capture.authorizations {
		if header != "Bearer token123" {
			capture.mu.Unlock()
			t.Fatalf("expected bearer token header, got %q", header)
		}
	}
	if len(capture.daemonEvents) != published {
		capture.mu.Unlock()
		t.Fatalf("expected published count %d to match events %d", published, len(capture.daemonEvents))
	}

	hasStatus := false
	hasFeedback := false
	hasHold := false
	statusEventFieldOK := false
	for _, event := range capture.daemonEvents {
		if event.TopicID != "topic_fixture_seeded" {
			capture.mu.Unlock()
			t.Fatalf("expected topic_fixture_seeded, got %q", event.TopicID)
		}
		switch event.Type {
		case DaemonEventStatusReport:
			hasStatus = true
			payload, ok := event.Payload.(map[string]any)
			if ok {
				if eventName, ok := payload["event"].(string); ok && strings.TrimSpace(eventName) != "" {
					statusEventFieldOK = true
				}
			}
		case DaemonEventFeedbackIngest:
			hasFeedback = true
		case DaemonEventBlockerEscalation:
			hasHold = true
		}
	}
	if !hasStatus || !hasFeedback || !hasHold {
		capture.mu.Unlock()
		t.Fatalf("missing daemon event types status=%v feedback=%v hold=%v", hasStatus, hasFeedback, hasHold)
	}
	if !statusEventFieldOK {
		capture.mu.Unlock()
		t.Fatalf("expected status_report payload.event to be populated")
	}
	eventCountBefore := len(capture.daemonEvents)
	capture.mu.Unlock()

	publishedAgain, err := integrated.PublishRun(context.Background(), run.ID)
	if err != nil {
		t.Fatalf("publish run second time: %v", err)
	}
	if publishedAgain != 0 {
		t.Fatalf("expected no duplicate publish, got %d", publishedAgain)
	}

	capture.mu.Lock()
	eventCountAfter := len(capture.daemonEvents)
	capture.mu.Unlock()
	if eventCountAfter != eventCountBefore {
		t.Fatalf("expected no extra daemon events on duplicate publish, before=%d after=%d", eventCountBefore, eventCountAfter)
	}

	cursorData, err := os.ReadFile(cfg.Daemon.PublishCursorPath)
	if err != nil {
		t.Fatalf("read publish cursor: %v", err)
	}
	if !strings.Contains(string(cursorData), run.ID) {
		t.Fatalf("expected cursor to include run id")
	}
}

func TestEnsureRuntimeReadyFailsWhenSmokeNotReady(t *testing.T) {
	t.Parallel()

	var mu sync.Mutex
	seedCalls := 0

	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/runtime/config":
			writeJSON(w, http.StatusOK, RuntimeConfigResponse{
				RuntimeName: "integration-runtime",
				SampleFixture: SampleFixtureInfo{
					TopicID: "topic_fixture_seeded",
				},
			})
		case "/runtime/fixtures/seed":
			mu.Lock()
			seedCalls++
			mu.Unlock()
			writeJSON(w, http.StatusOK, RuntimeSeedResponse{
				TopicCreated: true,
				AgentCount:   3,
			})
		case "/runtime/smoke":
			writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
				SampleTopicReady:      false,
				SampleTopicAgentCount: 0,
			})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer testServer.Close()

	root := t.TempDir()
	configPath := filepath.Join(root, "runtime", "shared-runtime-config.json")
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	payload := `{
  "workspace_id":"ws_test",
  "runtime_id":"runtime_test",
  "server":{"base_url":"` + testServer.URL + `"},
  "daemon":{"state_path":"data/state.json","ack_path":"data/ack.json","worktree_root":"data/worktrees","publish_cursor_path":"data/cursor.json"}
}`
	if err := os.WriteFile(configPath, []byte(payload), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := LoadSharedRuntimeConfig(configPath)
	if err != nil {
		t.Fatalf("load shared config: %v", err)
	}
	integrated, err := NewIntegratedDaemon(cfg)
	if err != nil {
		t.Fatalf("new integrated daemon: %v", err)
	}

	_, err = integrated.EnsureRuntimeReady(context.Background())
	if err == nil {
		t.Fatalf("expected EnsureRuntimeReady to fail when smoke is not ready")
	}
	if !strings.Contains(err.Error(), "runtime smoke not ready after fixture seed") {
		t.Fatalf("unexpected error: %v", err)
	}

	mu.Lock()
	defer mu.Unlock()
	if seedCalls != 1 {
		t.Fatalf("expected one fixture seed call, got %d", seedCalls)
	}
}

func TestEnsureRuntimeReadyWaitsForSmokeReady(t *testing.T) {
	t.Parallel()

	var mu sync.Mutex
	seedCalls := 0
	smokeCalls := 0

	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/runtime/config":
			writeJSON(w, http.StatusOK, RuntimeConfigResponse{
				RuntimeName: "integration-runtime",
				SampleFixture: SampleFixtureInfo{
					TopicID: "topic_fixture_seeded",
				},
			})
		case "/runtime/fixtures/seed":
			mu.Lock()
			seedCalls++
			mu.Unlock()
			writeJSON(w, http.StatusOK, RuntimeSeedResponse{
				TopicCreated: true,
				AgentCount:   3,
			})
		case "/runtime/smoke":
			mu.Lock()
			smokeCalls++
			currentSmokeCalls := smokeCalls
			mu.Unlock()
			if currentSmokeCalls < 3 {
				writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
					SampleTopicReady:      false,
					SampleTopicAgentCount: 0,
				})
				return
			}
			writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
				SampleTopicReady:      true,
				SampleTopicAgentCount: 3,
			})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer testServer.Close()

	root := t.TempDir()
	configPath := filepath.Join(root, "runtime", "shared-runtime-config.json")
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	payload := `{
  "workspace_id":"ws_test",
  "runtime_id":"runtime_test",
  "server":{"base_url":"` + testServer.URL + `"},
  "daemon":{"state_path":"data/state.json","ack_path":"data/ack.json","worktree_root":"data/worktrees","publish_cursor_path":"data/cursor.json"}
}`
	if err := os.WriteFile(configPath, []byte(payload), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := LoadSharedRuntimeConfig(configPath)
	if err != nil {
		t.Fatalf("load shared config: %v", err)
	}
	integrated, err := NewIntegratedDaemon(cfg)
	if err != nil {
		t.Fatalf("new integrated daemon: %v", err)
	}

	runtimeCfg, err := integrated.EnsureRuntimeReady(context.Background())
	if err != nil {
		t.Fatalf("expected EnsureRuntimeReady to succeed after delayed smoke ready: %v", err)
	}
	if runtimeCfg.SampleFixture.TopicID != "topic_fixture_seeded" {
		t.Fatalf("unexpected fixture topic id: %s", runtimeCfg.SampleFixture.TopicID)
	}

	mu.Lock()
	defer mu.Unlock()
	if seedCalls != 1 {
		t.Fatalf("expected one fixture seed call, got %d", seedCalls)
	}
	if smokeCalls < 5 {
		t.Fatalf("expected at least five smoke checks for stable readiness, got %d", smokeCalls)
	}
}

func TestEnsureRuntimeReadyRequiresStableReadiness(t *testing.T) {
	t.Parallel()

	var mu sync.Mutex
	seedCalls := 0
	smokeCalls := 0

	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/runtime/config":
			writeJSON(w, http.StatusOK, RuntimeConfigResponse{
				RuntimeName: "integration-runtime",
				SampleFixture: SampleFixtureInfo{
					TopicID: "topic_fixture_seeded",
				},
			})
		case "/runtime/fixtures/seed":
			mu.Lock()
			seedCalls++
			mu.Unlock()
			writeJSON(w, http.StatusOK, RuntimeSeedResponse{
				TopicCreated: true,
				AgentCount:   3,
			})
		case "/runtime/smoke":
			mu.Lock()
			smokeCalls++
			currentSmokeCalls := smokeCalls
			mu.Unlock()
			switch currentSmokeCalls {
			case 1:
				writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
					SampleTopicReady:      false,
					SampleTopicAgentCount: 0,
				})
			case 2:
				writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
					SampleTopicReady:      true,
					SampleTopicAgentCount: 3,
				})
			case 3:
				writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
					SampleTopicReady:      false,
					SampleTopicAgentCount: 0,
				})
			default:
				writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
					SampleTopicReady:      true,
					SampleTopicAgentCount: 3,
				})
			}
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer testServer.Close()

	root := t.TempDir()
	configPath := filepath.Join(root, "runtime", "shared-runtime-config.json")
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	payload := `{
  "workspace_id":"ws_test",
  "runtime_id":"runtime_test",
  "server":{"base_url":"` + testServer.URL + `"},
  "daemon":{"state_path":"data/state.json","ack_path":"data/ack.json","worktree_root":"data/worktrees","publish_cursor_path":"data/cursor.json"}
}`
	if err := os.WriteFile(configPath, []byte(payload), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := LoadSharedRuntimeConfig(configPath)
	if err != nil {
		t.Fatalf("load shared config: %v", err)
	}
	integrated, err := NewIntegratedDaemon(cfg)
	if err != nil {
		t.Fatalf("new integrated daemon: %v", err)
	}

	if _, err := integrated.EnsureRuntimeReady(context.Background()); err != nil {
		t.Fatalf("expected EnsureRuntimeReady to eventually succeed with stable smoke readiness: %v", err)
	}

	mu.Lock()
	defer mu.Unlock()
	if seedCalls != 1 {
		t.Fatalf("expected one fixture seed call, got %d", seedCalls)
	}
	if smokeCalls < 6 {
		t.Fatalf("expected at least six smoke checks to reject transient ready, got %d", smokeCalls)
	}
}

func TestEnsureRuntimeReadyFailsWhenShellStateNotReady(t *testing.T) {
	t.Parallel()

	var mu sync.Mutex
	seedCalls := 0
	smokeCalls := 0

	runtimeServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/runtime/config":
			writeJSON(w, http.StatusOK, RuntimeConfigResponse{
				RuntimeName: "integration-runtime",
				SampleFixture: SampleFixtureInfo{
					TopicID: "topic_fixture_seeded",
				},
			})
		case "/runtime/fixtures/seed":
			mu.Lock()
			seedCalls++
			mu.Unlock()
			writeJSON(w, http.StatusOK, RuntimeSeedResponse{
				TopicCreated: true,
				AgentCount:   3,
			})
		case "/runtime/smoke":
			mu.Lock()
			smokeCalls++
			mu.Unlock()
			writeJSON(w, http.StatusOK, RuntimeSmokeResponse{
				SampleTopicReady:      true,
				SampleTopicAgentCount: 3,
			})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer runtimeServer.Close()

	shellServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusBadRequest, map[string]any{
			"error":   "topic_not_found",
			"message": "topic topic_fixture_seeded not found",
		})
	}))
	defer shellServer.Close()

	root := t.TempDir()
	configPath := filepath.Join(root, "runtime", "shared-runtime-config.json")
	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}
	payload := `{
  "workspace_id":"ws_test",
  "runtime_id":"runtime_test",
  "shell_state_url":"` + shellServer.URL + `",
  "server":{"base_url":"` + runtimeServer.URL + `"},
  "daemon":{"state_path":"data/state.json","ack_path":"data/ack.json","worktree_root":"data/worktrees","publish_cursor_path":"data/cursor.json"}
}`
	if err := os.WriteFile(configPath, []byte(payload), 0o644); err != nil {
		t.Fatalf("write config: %v", err)
	}

	cfg, err := LoadSharedRuntimeConfig(configPath)
	if err != nil {
		t.Fatalf("load shared config: %v", err)
	}
	integrated, err := NewIntegratedDaemon(cfg)
	if err != nil {
		t.Fatalf("new integrated daemon: %v", err)
	}

	_, err = integrated.EnsureRuntimeReady(context.Background())
	if err == nil {
		t.Fatalf("expected EnsureRuntimeReady to fail when shell state is not ready")
	}
	if !strings.Contains(err.Error(), "shell state not ready") {
		t.Fatalf("unexpected error: %v", err)
	}

	mu.Lock()
	defer mu.Unlock()
	if seedCalls != 1 {
		t.Fatalf("expected one fixture seed call, got %d", seedCalls)
	}
	if smokeCalls < runtimeReadyStableChecks {
		t.Fatalf("expected at least %d smoke checks, got %d", runtimeReadyStableChecks, smokeCalls)
	}
}
