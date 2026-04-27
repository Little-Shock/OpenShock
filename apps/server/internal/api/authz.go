package api

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/Larkspur-Wang/OpenShock/apps/server/internal/store"
)

const authSessionStatusActive = "active"
const (
	authSessionEmailVerificationVerified = "verified"
	authSessionDeviceStatusAuthorized    = "authorized"
	authSessionMemberStatusActive        = "active"
)

func init() {
	issueCreateGuard = func(s *Server, w http.ResponseWriter, r *http.Request) bool {
		return s.requireRequestSessionPermission(w, r, "issue.create")
	}
	roomReplyGuard = func(s *Server, w http.ResponseWriter, r *http.Request) bool {
		return s.requireRequestSessionPermission(w, r, "room.reply")
	}
	roomPullRequestGuard = func(s *Server, w http.ResponseWriter, r *http.Request) bool {
		return s.requireRequestSessionPermission(w, r, "pull_request.review")
	}
	runtimeManageGuard = func(s *Server, w http.ResponseWriter, r *http.Request) bool {
		return s.requireRequestSessionPermission(w, r, "runtime.manage")
	}
	runExecuteGuard = func(s *Server, w http.ResponseWriter, r *http.Request) bool {
		return s.requireRequestSessionPermission(w, r, "run.execute")
	}
	pullRequestRouteGuard = func(s *Server, w http.ResponseWriter, r *http.Request, status string) bool {
		return s.requireRequestSessionPermission(w, r, permissionForPullRequestMutation(status))
	}
}

func (s *Server) requireSessionPermission(w http.ResponseWriter, permission string) bool {
	snapshot := s.store.Snapshot()
	session := snapshot.Auth.Session
	payload := map[string]any{
		"permission": permission,
		"session":    session,
	}

	if strings.TrimSpace(session.Status) != authSessionStatusActive {
		payload["error"] = store.ErrAuthSessionRequired.Error()
		writeJSON(w, http.StatusUnauthorized, payload)
		return false
	}

	if readinessError := authSessionPermissionReadinessError(session); readinessError != "" {
		payload["error"] = readinessError
		writeJSON(w, http.StatusForbidden, payload)
		return false
	}

	if !authSessionHasPermission(session, permission) {
		payload["error"] = fmt.Sprintf("permission %q required", permission)
		writeJSON(w, http.StatusForbidden, payload)
		return false
	}

	return true
}

func authSessionHasPermission(session store.AuthSession, permission string) bool {
	if strings.TrimSpace(session.Status) != authSessionStatusActive || authSessionPermissionReadinessError(session) != "" {
		return false
	}
	return authSessionHasRawPermission(session, permission)
}

func authSessionHasRawPermission(session store.AuthSession, permission string) bool {
	if strings.TrimSpace(session.Status) != authSessionStatusActive {
		return false
	}
	for _, granted := range session.Permissions {
		if granted == permission {
			return true
		}
	}
	return false
}

func authSessionPermissionReadinessError(session store.AuthSession) string {
	if verificationStatus := strings.TrimSpace(session.EmailVerificationStatus); verificationStatus != "" && verificationStatus != authSessionEmailVerificationVerified {
		return "email verification required"
	}
	if deviceStatus := strings.TrimSpace(session.DeviceAuthStatus); deviceStatus != "" && deviceStatus != authSessionDeviceStatusAuthorized {
		return "device authorization required"
	}
	if memberStatus := strings.TrimSpace(session.MemberStatus); memberStatus != "" && memberStatus != authSessionMemberStatusActive {
		return store.ErrWorkspaceMemberApprovalRequired.Error()
	}
	return ""
}

func permissionForPullRequestMutation(status string) string {
	if strings.EqualFold(strings.TrimSpace(status), "merged") {
		return "pull_request.merge"
	}
	return "pull_request.review"
}

func permissionForInboxDecision(item store.InboxItem, decision string) string {
	if strings.EqualFold(strings.TrimSpace(item.Kind), "review") && strings.EqualFold(strings.TrimSpace(decision), "changes_requested") {
		return "inbox.review"
	}
	return "inbox.decide"
}
