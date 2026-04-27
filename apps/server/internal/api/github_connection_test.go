package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	githubsvc "github.com/Larkspur-Wang/OpenShock/apps/server/internal/github"
	"github.com/Larkspur-Wang/OpenShock/apps/server/internal/store"
)

type fakeGitHubProber struct {
	status githubsvc.Status
	err    error
}

func (f fakeGitHubProber) Probe(_ string) (githubsvc.Status, error) {
	return f.status, f.err
}

func (f fakeGitHubProber) CreatePullRequest(string, githubsvc.CreatePullRequestInput) (githubsvc.PullRequest, error) {
	return githubsvc.PullRequest{}, nil
}

func (f fakeGitHubProber) SyncPullRequest(string, githubsvc.SyncPullRequestInput) (githubsvc.PullRequest, error) {
	return githubsvc.PullRequest{}, nil
}

func (f fakeGitHubProber) MergePullRequest(string, githubsvc.MergePullRequestInput) (githubsvc.PullRequest, error) {
	return githubsvc.PullRequest{}, nil
}

func TestGitHubConnectionEndpointReturnsProbeStatus(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New() error = %v", err)
	}

	server := httptest.NewServer(New(s, http.DefaultClient, Config{
		DaemonURL:     "http://127.0.0.1:65531",
		WorkspaceRoot: root,
		GitHub: fakeGitHubProber{
			status: githubsvc.Status{
				Repo:             "Larkspur-Wang/OpenShock",
				RepoURL:          "https://github.com/Larkspur-Wang/OpenShock.git",
				Branch:           "main",
				Provider:         "github",
				RemoteConfigured: true,
				GHCLIInstalled:   true,
				GHAuthenticated:  true,
				Ready:            true,
				AuthMode:         "gh-cli",
				Message:          "GitHub 命令行已登录，可以继续处理远端拉取请求。",
			},
		},
	}).Handler())
	defer server.Close()

	resp, err := http.Get(server.URL + "/v1/github/connection")
	if err != nil {
		t.Fatalf("GET github connection error = %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var payload githubsvc.Status
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if !payload.Ready {
		t.Fatalf("payload.Ready = false, want true")
	}
	if payload.Source != "probe" {
		t.Fatalf("payload.Source = %q, want probe", payload.Source)
	}
	if payload.Stale {
		t.Fatalf("payload.Stale = true, want false")
	}
	if payload.AuthMode != "gh-cli" {
		t.Fatalf("payload.AuthMode = %q, want gh-cli", payload.AuthMode)
	}
}

func TestGitHubConnectionEndpointSurfacesPublicIngressURLsWhenControlURLConfigured(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New() error = %v", err)
	}

	server := httptest.NewServer(New(s, http.DefaultClient, Config{
		DaemonURL:     "http://127.0.0.1:65531",
		ControlURL:    "https://public.openshock.dev/",
		WorkspaceRoot: root,
		GitHub: fakeGitHubProber{
			status: githubsvc.Status{
				Repo:              "Larkspur-Wang/OpenShock",
				RepoURL:           "https://github.com/Larkspur-Wang/OpenShock.git",
				Branch:            "main",
				Provider:          "github",
				RemoteConfigured:  true,
				AppConfigured:     true,
				AppInstalled:      false,
				PreferredAuthMode: "github-app",
				Message:           "GitHub 应用已配置，但还没完成安装。",
			},
		},
	}).Handler())
	defer server.Close()

	resp, err := http.Get(server.URL + "/v1/github/connection")
	if err != nil {
		t.Fatalf("GET github connection error = %v", err)
	}
	defer resp.Body.Close()

	var payload githubsvc.Status
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if payload.CallbackURL != "https://public.openshock.dev/setup/github/callback" {
		t.Fatalf("payload.CallbackURL = %q, want public callback URL", payload.CallbackURL)
	}
	if payload.WebhookURL != "https://public.openshock.dev/v1/github/webhook" {
		t.Fatalf("payload.WebhookURL = %q, want public webhook URL", payload.WebhookURL)
	}
}

func TestGitHubConnectionEndpointBuildsPublicIngressURLsWhenProbeFallsBackToWorkspace(t *testing.T) {
	root := initGitBindingRepo(t, "https://github.com/example/phase-zero.git")
	statePath := filepath.Join(root, "data", "state.json")

	s, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New() error = %v", err)
	}
	if _, err := s.UpdateRepoBinding(store.RepoBindingInput{
		Repo:       "example/phase-zero",
		RepoURL:    "https://github.com/example/phase-zero.git",
		Branch:     "main",
		Provider:   "github",
		AuthMode:   "github-app",
		DetectedAt: "2026-04-09T00:00:00Z",
		SyncedAt:   "2026-04-09T00:00:00Z",
	}); err != nil {
		t.Fatalf("UpdateRepoBinding() error = %v", err)
	}

	server := httptest.NewServer(New(s, http.DefaultClient, Config{
		DaemonURL:     "http://127.0.0.1:65531",
		ControlURL:    "https://public.openshock.dev/",
		WorkspaceRoot: root,
		GitHub: fakeGitHubProber{
			err: errProbeFailed,
		},
	}).Handler())
	defer server.Close()

	resp, err := http.Get(server.URL + "/v1/github/connection")
	if err != nil {
		t.Fatalf("GET github connection error = %v", err)
	}
	defer resp.Body.Close()

	var payload githubsvc.Status
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if payload.Repo != "example/phase-zero" {
		t.Fatalf("payload.Repo = %q, want example/phase-zero", payload.Repo)
	}
	if payload.Source != "workspace_snapshot" {
		t.Fatalf("payload.Source = %q, want workspace_snapshot", payload.Source)
	}
	if payload.Stale {
		t.Fatalf("payload.Stale = true, want false for current workspace snapshot")
	}
	if !strings.Contains(payload.Message, "工作区快照") {
		t.Fatalf("payload.Message = %q, want workspace snapshot provenance", payload.Message)
	}
	if payload.CallbackURL != "https://public.openshock.dev/setup/github/callback" {
		t.Fatalf("payload.CallbackURL = %q, want public callback URL", payload.CallbackURL)
	}
	if payload.WebhookURL != "https://public.openshock.dev/v1/github/webhook" {
		t.Fatalf("payload.WebhookURL = %q, want public webhook URL", payload.WebhookURL)
	}
}

func TestGitHubConnectionEndpointReturnsGitHubAppContract(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New() error = %v", err)
	}

	server := httptest.NewServer(New(s, http.DefaultClient, Config{
		DaemonURL:     "http://127.0.0.1:65531",
		WorkspaceRoot: root,
		GitHub: fakeGitHubProber{
			status: githubsvc.Status{
				Repo:              "Larkspur-Wang/OpenShock",
				RepoURL:           "https://github.com/Larkspur-Wang/OpenShock.git",
				Branch:            "main",
				Provider:          "github",
				RemoteConfigured:  true,
				AppID:             "12345",
				AppSlug:           "openshock-app",
				AppConfigured:     true,
				AppInstalled:      true,
				InstallationID:    "67890",
				InstallationURL:   "https://github.com/settings/installations/67890",
				Ready:             true,
				AuthMode:          "github-app",
				PreferredAuthMode: "github-app",
				Message:           "GitHub 应用已就绪，可以继续连接仓库与回调。",
			},
		},
	}).Handler())
	defer server.Close()

	resp, err := http.Get(server.URL + "/v1/github/connection")
	if err != nil {
		t.Fatalf("GET github connection error = %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var payload githubsvc.Status
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if payload.AuthMode != "github-app" {
		t.Fatalf("payload.AuthMode = %q, want github-app", payload.AuthMode)
	}
	if payload.PreferredAuthMode != "github-app" {
		t.Fatalf("payload.PreferredAuthMode = %q, want github-app", payload.PreferredAuthMode)
	}
	if !payload.AppConfigured || !payload.AppInstalled {
		t.Fatalf("payload app readiness = (%t, %t), want true/true", payload.AppConfigured, payload.AppInstalled)
	}
	if payload.InstallationID != "67890" {
		t.Fatalf("payload.InstallationID = %q, want 67890", payload.InstallationID)
	}
}

func TestBuildWorkspaceGitHubStatusMarksStalePersistedSnapshotNotReady(t *testing.T) {
	status := buildWorkspaceGitHubStatus(store.WorkspaceSnapshot{
		Repo:              "example/phase-zero",
		RepoURL:           "https://github.com/example/phase-zero.git",
		Branch:            "main",
		RepoProvider:      "github",
		RepoBindingStatus: "bound",
		RepoAuthMode:      "github-app",
		RepoBinding: store.WorkspaceRepoBindingSnapshot{
			Repo:          "example/phase-zero",
			RepoURL:       "https://github.com/example/phase-zero.git",
			Branch:        "main",
			Provider:      "github",
			BindingStatus: "bound",
			AuthMode:      "github-app",
			DetectedAt:    "2026-04-10T12:00:00Z",
			SyncedAt:      "2026-04-10T12:00:00Z",
		},
		GitHubInstallation: store.WorkspaceGitHubInstallSnapshot{
			Provider:          "github",
			PreferredAuthMode: "github-app",
			ConnectionReady:   true,
			AppConfigured:     true,
			AppInstalled:      true,
			InstallationID:    "67890",
			ConnectionMessage: "GitHub 应用已接通。",
			SyncedAt:          "2026-04-09T12:00:00Z",
		},
	}, "https://public.openshock.dev")

	if status.Ready {
		t.Fatalf("status.Ready = true, want false for stale persisted GitHub snapshot")
	}
	if status.Source != "workspace_snapshot" {
		t.Fatalf("status.Source = %q, want workspace_snapshot", status.Source)
	}
	if !status.Stale {
		t.Fatalf("status.Stale = false, want true for stale persisted GitHub snapshot")
	}
	if !strings.Contains(status.Message, "过期") {
		t.Fatalf("status.Message = %q, want stale marker", status.Message)
	}
}

func TestGitHubConnectionEndpointSurfacesEffectiveAuthModeWhenGitHubAppFallsBackToGHCLI(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := store.New(statePath, root)
	if err != nil {
		t.Fatalf("store.New() error = %v", err)
	}

	server := httptest.NewServer(New(s, http.DefaultClient, Config{
		DaemonURL:     "http://127.0.0.1:65531",
		WorkspaceRoot: root,
		GitHub: fakeGitHubProber{
			status: githubsvc.Status{
				Repo:              "Larkspur-Wang/OpenShock",
				RepoURL:           "https://github.com/Larkspur-Wang/OpenShock.git",
				Branch:            "main",
				Provider:          "github",
				RemoteConfigured:  true,
				GHCLIInstalled:    true,
				GHAuthenticated:   true,
				AppID:             "12345",
				AppSlug:           "openshock-app",
				Ready:             false,
				AuthMode:          "gh-cli",
				PreferredAuthMode: "github-app",
				Message:           "GitHub 应用配置不完整，缺少 privateKey / installationId；当前先使用命令行登录。",
			},
		},
	}).Handler())
	defer server.Close()

	resp, err := http.Get(server.URL + "/v1/github/connection")
	if err != nil {
		t.Fatalf("GET github connection error = %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want %d", resp.StatusCode, http.StatusOK)
	}

	var payload githubsvc.Status
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("Decode() error = %v", err)
	}
	if payload.AuthMode != "gh-cli" {
		t.Fatalf("payload.AuthMode = %q, want gh-cli", payload.AuthMode)
	}
	if payload.PreferredAuthMode != "github-app" {
		t.Fatalf("payload.PreferredAuthMode = %q, want github-app", payload.PreferredAuthMode)
	}
	if payload.Ready {
		t.Fatalf("payload.Ready = true, want false when preferred github-app path is not ready")
	}
}
