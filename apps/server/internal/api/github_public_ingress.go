package api

import (
	"strings"

	githubsvc "github.com/Larkspur-Wang/OpenShock/apps/server/internal/github"
)

func (s *Server) withGitHubPublicIngress(status githubsvc.Status) githubsvc.Status {
	base := strings.TrimRight(strings.TrimSpace(s.controlURL), "/")
	if base == "" {
		status.CallbackURL = ""
		status.WebhookURL = ""
		return status
	}
	status.CallbackURL = base + "/setup/github/callback"
	status.WebhookURL = base + "/v1/github/webhook"
	return status
}
