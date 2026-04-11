package store

import (
	"errors"
	"testing"

	"openshock/backend/internal/testsupport/scenario"
)

func TestRegisterLoginSessionAndLogout(t *testing.T) {
	s := NewMemoryStoreFromSnapshot(scenario.Snapshot())

	registerResp, err := s.RegisterMember("sarah", "Sarah", "password123")
	if err != nil {
		t.Fatalf("register member returned error: %v", err)
	}
	if registerResp.SessionToken == "" {
		t.Fatal("expected register to return session token")
	}
	if registerResp.Member.DisplayName != "Sarah" {
		t.Fatalf("expected display name Sarah, got %q", registerResp.Member.DisplayName)
	}

	member, session, ok := s.LookupMemberBySessionToken(registerResp.SessionToken)
	if !ok {
		t.Fatal("expected register session token to resolve")
	}
	if member.ID != registerResp.Member.ID || session.MemberID != registerResp.Member.ID {
		t.Fatalf("unexpected member/session payload: member=%#v session=%#v", member, session)
	}

	if !s.LogoutSession(registerResp.SessionToken) {
		t.Fatal("expected logout to revoke the active session")
	}
	if _, _, ok := s.LookupMemberBySessionToken(registerResp.SessionToken); ok {
		t.Fatal("expected revoked session to become invalid")
	}

	loginResp, err := s.LoginMember("sarah", "password123")
	if err != nil {
		t.Fatalf("login returned error: %v", err)
	}
	if loginResp.SessionToken == "" || loginResp.SessionToken == registerResp.SessionToken {
		t.Fatalf("expected login to issue a fresh session token, got %q", loginResp.SessionToken)
	}
}

func TestRegisterConflictAndInvalidLogin(t *testing.T) {
	s := NewMemoryStoreFromSnapshot(scenario.Snapshot())

	if _, err := s.RegisterMember("sarah", "Sarah", "password123"); err != nil {
		t.Fatalf("initial register returned error: %v", err)
	}
	if _, err := s.RegisterMember("sarah", "Sarah 2", "password123"); !errors.Is(err, ErrConflict) {
		t.Fatalf("expected ErrConflict for duplicate username, got %v", err)
	}
	if _, err := s.LoginMember("sarah", "wrong-password"); !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("expected ErrUnauthorized for wrong password, got %v", err)
	}
}

func TestUpdateMemberDisplayName(t *testing.T) {
	s := NewMemoryStoreFromSnapshot(scenario.Snapshot())

	registerResp, err := s.RegisterMember("sarah", "Sarah", "password123")
	if err != nil {
		t.Fatalf("register member returned error: %v", err)
	}

	updated, err := s.UpdateMemberDisplayName(registerResp.Member.ID, "Sarah Chen")
	if err != nil {
		t.Fatalf("update member display name returned error: %v", err)
	}
	if updated.DisplayName != "Sarah Chen" {
		t.Fatalf("expected updated display name, got %#v", updated)
	}
}
