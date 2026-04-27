package api

import (
	"net/http"
	"strings"
	"time"

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

	writeJSON(w, http.StatusOK, markGitHubProbeStatus(s.withGitHubPublicIngress(status)))
}

func buildWorkspaceGitHubStatus(workspace store.WorkspaceSnapshot, controlURL string) githubsvc.Status {
	binding := storeBindingSnapshot(workspace)
	installation := workspaceGitHubInstallationSnapshot(workspace)
	preferredAuthMode := defaultString(strings.TrimSpace(installation.PreferredAuthMode), defaultString(strings.TrimSpace(binding.AuthMode), defaultString(strings.TrimSpace(workspace.RepoAuthMode), "unavailable")))
	authMode := defaultString(strings.TrimSpace(binding.AuthMode), defaultString(strings.TrimSpace(workspace.RepoAuthMode), preferredAuthMode))
	ready, stale := workspaceGitHubFallbackReadiness(binding, installation, authMode, preferredAuthMode)
	message := workspaceGitHubFallbackMessage(installation.ConnectionMessage, stale, ready, preferredAuthMode)
	status := githubsvc.Status{
		Repo:              binding.Repo,
		RepoURL:           binding.RepoURL,
		Branch:            binding.Branch,
		Provider:          binding.Provider,
		Source:            "workspace_snapshot",
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
		Ready:             ready,
		Stale:             stale,
		AuthMode:          authMode,
		PreferredAuthMode: preferredAuthMode,
		Message:           message,
	}
	base := strings.TrimRight(strings.TrimSpace(controlURL), "/")
	if base != "" {
		status.CallbackURL = base + "/setup/github/callback"
		status.WebhookURL = base + "/v1/github/webhook"
	}
	return status
}

func markGitHubProbeStatus(status githubsvc.Status) githubsvc.Status {
	status.Source = "probe"
	status.Stale = false
	return status
}

func workspaceGitHubFallbackReadiness(
	binding store.WorkspaceRepoBindingSnapshot,
	installation store.WorkspaceGitHubInstallSnapshot,
	authMode string,
	preferredAuthMode string,
) (ready bool, stale bool) {
	if !workspaceGitHubSnapshotIsCurrent(binding, installation) {
		return false, true
	}

	remoteConfigured := strings.TrimSpace(binding.RepoURL) != ""
	if !remoteConfigured || !installation.ConnectionReady {
		return false, false
	}

	if strings.EqualFold(authMode, "github-app") || strings.EqualFold(preferredAuthMode, "github-app") {
		return strings.EqualFold(defaultString(strings.TrimSpace(binding.Provider), "github"), "github") && installation.AppConfigured && installation.AppInstalled, false
	}

	return true, false
}

func workspaceGitHubFallbackMessage(message string, stale bool, ready bool, preferredAuthMode string) string {
	trimmed := strings.TrimSpace(message)
	if stale {
		if trimmed == "" {
			if strings.EqualFold(preferredAuthMode, "github-app") {
				return "GitHub 状态可能已过期，请重新检查 GitHub 安装。"
			}
			return "GitHub 状态可能已过期，请重新检查。"
		}
		return trimmed + " 当前状态可能已过期，请重新检查。"
	}
	if trimmed != "" {
		return trimmed + " 当前展示的是工作区快照，请重新检查以确认实时状态。"
	}
	if ready {
		return "工作区最近一次记录显示 GitHub 已接通；请重新检查以确认实时状态。"
	}
	return "当前展示的是工作区快照，等待 GitHub 状态检查或安装回调返回结果。"
}

func workspaceGitHubSnapshotIsCurrent(binding store.WorkspaceRepoBindingSnapshot, installation store.WorkspaceGitHubInstallSnapshot) bool {
	installationAt, ok := parseWorkspaceTimestamp(installation.SyncedAt)
	if !ok {
		return false
	}
	if bindingAt, ok := latestWorkspaceTimestamp(binding.SyncedAt, binding.DetectedAt); ok && installationAt.Before(bindingAt) {
		return false
	}
	return true
}

func latestWorkspaceTimestamp(values ...string) (time.Time, bool) {
	var latest time.Time
	var found bool
	for _, value := range values {
		if timestamp, ok := parseWorkspaceTimestamp(value); ok && (!found || timestamp.After(latest)) {
			latest = timestamp
			found = true
		}
	}
	return latest, found
}

func parseWorkspaceTimestamp(value string) (time.Time, bool) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, false
	}
	timestamp, err := time.Parse(time.RFC3339, trimmed)
	if err != nil {
		return time.Time{}, false
	}
	return timestamp, true
}
