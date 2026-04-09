package api

import (
	"net/http"
	"strings"

	githubsvc "github.com/Larkspur-Wang/OpenShock/apps/server/internal/github"
	"github.com/Larkspur-Wang/OpenShock/apps/server/internal/store"
)

func (s *Server) handleGitHubConnection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	status, err := s.github.Probe(s.workspaceRoot)
	if err != nil {
		writeJSON(w, http.StatusOK, buildWorkspaceGitHubStatus(s.store.Snapshot().Workspace, s.controlURL))
		return
	}

	writeJSON(w, http.StatusOK, s.withGitHubPublicIngress(status))
}

func buildWorkspaceGitHubStatus(workspace store.WorkspaceSnapshot, controlURL string) githubsvc.Status {
	binding := storeBindingSnapshot(workspace)
	installation := workspaceGitHubInstallationSnapshot(workspace)
	status := githubsvc.Status{
		Repo:              binding.Repo,
		RepoURL:           binding.RepoURL,
		Branch:            binding.Branch,
		Provider:          binding.Provider,
		RemoteConfigured:  strings.TrimSpace(binding.RepoURL) != "",
		GHCLIInstalled:    false,
		GHAuthenticated:   false,
		AppID:             "",
		AppSlug:           "",
		AppConfigured:     installation.AppConfigured,
		AppInstalled:      installation.AppInstalled,
		InstallationID:    installation.InstallationID,
		InstallationURL:   installation.InstallationURL,
		Missing:           append([]string{}, installation.Missing...),
		Ready:             installation.ConnectionReady,
		AuthMode:          binding.AuthMode,
		PreferredAuthMode: installation.PreferredAuthMode,
		Message:           installation.ConnectionMessage,
	}
	base := strings.TrimRight(strings.TrimSpace(controlURL), "/")
	if base != "" {
		status.CallbackURL = base + "/setup/github/callback"
		status.WebhookURL = base + "/v1/github/webhook"
	}
	return status
}
