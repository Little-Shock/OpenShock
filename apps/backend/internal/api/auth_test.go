package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"openshock/backend/internal/store"
	"openshock/backend/internal/testsupport/scenario"
)

func TestAuthLifecycleAndProfileUpdate(t *testing.T) {
	api := New(store.NewMemoryStore())

	registerBody := []byte(`{"username":"sarah","displayName":"Sarah Chen","password":"password123"}`)
	registerReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(registerBody))
	registerReq.Header.Set("Content-Type", "application/json")
	registerRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(registerRec, registerReq)

	if registerRec.Code != http.StatusOK {
		t.Fatalf("expected register 200, got %d with body %s", registerRec.Code, registerRec.Body.String())
	}

	var registerPayload struct {
		SessionToken string `json:"sessionToken"`
		Member       struct {
			ID          string `json:"id"`
			Username    string `json:"username"`
			DisplayName string `json:"displayName"`
		} `json:"member"`
	}
	if err := json.Unmarshal(registerRec.Body.Bytes(), &registerPayload); err != nil {
		t.Fatalf("invalid register response: %v", err)
	}
	if registerPayload.SessionToken == "" {
		t.Fatal("expected register response to include a session token")
	}
	if registerPayload.Member.Username != "sarah" || registerPayload.Member.DisplayName != "Sarah Chen" {
		t.Fatalf("unexpected register payload: %#v", registerPayload.Member)
	}

	sessionReq := httptest.NewRequest(http.MethodGet, "/api/v1/auth/session", nil)
	sessionReq.Header.Set(sessionHeaderName, registerPayload.SessionToken)
	sessionRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(sessionRec, sessionReq)

	if sessionRec.Code != http.StatusOK {
		t.Fatalf("expected session 200, got %d with body %s", sessionRec.Code, sessionRec.Body.String())
	}

	var sessionPayload struct {
		Authenticated bool `json:"authenticated"`
		Member        *struct {
			DisplayName string `json:"displayName"`
		} `json:"member"`
	}
	if err := json.Unmarshal(sessionRec.Body.Bytes(), &sessionPayload); err != nil {
		t.Fatalf("invalid session response: %v", err)
	}
	if !sessionPayload.Authenticated || sessionPayload.Member == nil {
		t.Fatalf("expected authenticated session payload, got %#v", sessionPayload)
	}
	if sessionPayload.Member.DisplayName != "Sarah Chen" {
		t.Fatalf("expected register session display name, got %#v", sessionPayload.Member)
	}

	profileBody := []byte(`{"displayName":"Sarah Operator"}`)
	profileReq := httptest.NewRequest(http.MethodPatch, "/api/v1/auth/profile", bytes.NewReader(profileBody))
	profileReq.Header.Set("Content-Type", "application/json")
	profileReq.Header.Set(sessionHeaderName, registerPayload.SessionToken)
	profileRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(profileRec, profileReq)

	if profileRec.Code != http.StatusOK {
		t.Fatalf("expected profile patch 200, got %d with body %s", profileRec.Code, profileRec.Body.String())
	}

	loginBody := []byte(`{"username":"sarah","password":"password123"}`)
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(loginRec, loginReq)

	if loginRec.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d with body %s", loginRec.Code, loginRec.Body.String())
	}

	var loginPayload struct {
		SessionToken string `json:"sessionToken"`
		Member       struct {
			DisplayName string `json:"displayName"`
		} `json:"member"`
	}
	if err := json.Unmarshal(loginRec.Body.Bytes(), &loginPayload); err != nil {
		t.Fatalf("invalid login response: %v", err)
	}
	if loginPayload.Member.DisplayName != "Sarah Operator" {
		t.Fatalf("expected login to return updated display name, got %#v", loginPayload.Member)
	}

	logoutReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	logoutReq.Header.Set(sessionHeaderName, loginPayload.SessionToken)
	logoutRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(logoutRec, logoutReq)

	if logoutRec.Code != http.StatusOK {
		t.Fatalf("expected logout 200, got %d with body %s", logoutRec.Code, logoutRec.Body.String())
	}
}

func TestMemberActionRequiresSessionAndIgnoresSpoofedActorID(t *testing.T) {
	api := New(store.NewMemoryStoreFromSnapshot(scenario.Snapshot()))

	body := []byte(`{"actorType":"member","actorId":"Mallory","actionType":"RoomMessage.post","targetType":"room","targetId":"room_001","idempotencyKey":"auth-action-1","payload":{"body":"请更新这个房间。"}}`)
	unauthorizedReq := httptest.NewRequest(http.MethodPost, "/api/v1/actions", bytes.NewReader(body))
	unauthorizedReq.Header.Set("Content-Type", "application/json")
	unauthorizedRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(unauthorizedRec, unauthorizedReq)

	if unauthorizedRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected unauthorized member action, got %d with body %s", unauthorizedRec.Code, unauthorizedRec.Body.String())
	}

	token := memberSessionTokenForAPITest(t, api, "sarah_spoof", "Sarah Chen")
	authorizedReq := httptest.NewRequest(http.MethodPost, "/api/v1/actions", bytes.NewReader(body))
	authorizedReq.Header.Set("Content-Type", "application/json")
	authorizedReq.Header.Set(sessionHeaderName, token)
	authorizedRec := httptest.NewRecorder()
	api.Handler().ServeHTTP(authorizedRec, authorizedReq)

	if authorizedRec.Code != http.StatusOK {
		t.Fatalf("expected authorized member action, got %d with body %s", authorizedRec.Code, authorizedRec.Body.String())
	}

	detail, err := api.store.RoomDetail("room_001")
	if err != nil {
		t.Fatalf("room detail returned error: %v", err)
	}
	lastMessage := detail.Messages[len(detail.Messages)-1]
	if lastMessage.ActorName != "Sarah Chen" {
		t.Fatalf("expected backend to use authenticated display name, got %#v", lastMessage)
	}
}
