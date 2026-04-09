package api

import (
	"net/http"
	"testing"

	"github.com/Larkspur-Wang/OpenShock/apps/server/internal/store"
)

func TestRunSandboxRouteSupportsRestrictedPolicyAndOverrideRetry(t *testing.T) {
	root := t.TempDir()
	_, server := newContractTestServer(t, root, "http://127.0.0.1:65531")
	defer server.Close()

	updateResp := doJSONRequest(
		t,
		http.DefaultClient,
		http.MethodPatch,
		server.URL+"/v1/runs/run_runtime_01/sandbox",
		`{"profile":"restricted","allowedHosts":["github.com"],"allowedCommands":["git status"],"allowedTools":["read_file"]}`,
	)
	defer updateResp.Body.Close()
	if updateResp.StatusCode != http.StatusOK {
		t.Fatalf("PATCH /v1/runs/:id/sandbox status = %d, want %d", updateResp.StatusCode, http.StatusOK)
	}

	var updatePayload struct {
		Run     store.Run           `json:"run"`
		Sandbox store.SandboxPolicy `json:"sandbox"`
	}
	decodeJSON(t, updateResp, &updatePayload)
	if updatePayload.Run.Sandbox.Profile != "restricted" || len(updatePayload.Sandbox.AllowedCommands) != 1 {
		t.Fatalf("sandbox update payload = %#v, want restricted policy", updatePayload)
	}

	deniedResp := doJSONRequest(
		t,
		http.DefaultClient,
		http.MethodPost,
		server.URL+"/v1/runs/run_runtime_01/sandbox",
		`{"kind":"network","target":"api.openai.com"}`,
	)
	defer deniedResp.Body.Close()
	if deniedResp.StatusCode != http.StatusConflict {
		t.Fatalf("POST denied sandbox check status = %d, want %d", deniedResp.StatusCode, http.StatusConflict)
	}

	var deniedPayload struct {
		Run      store.Run             `json:"run"`
		Decision store.SandboxDecision `json:"decision"`
	}
	decodeJSON(t, deniedResp, &deniedPayload)
	if deniedPayload.Decision.Status != "denied" || deniedPayload.Run.SandboxDecision.Status != "denied" {
		t.Fatalf("denied payload = %#v, want denied", deniedPayload)
	}

	approvalResp := doJSONRequest(
		t,
		http.DefaultClient,
		http.MethodPost,
		server.URL+"/v1/runs/run_runtime_01/sandbox",
		`{"kind":"command","target":"git push --force"}`,
	)
	defer approvalResp.Body.Close()
	if approvalResp.StatusCode != http.StatusAccepted {
		t.Fatalf("POST approval sandbox check status = %d, want %d", approvalResp.StatusCode, http.StatusAccepted)
	}

	var approvalPayload struct {
		Run      store.Run             `json:"run"`
		Decision store.SandboxDecision `json:"decision"`
	}
	decodeJSON(t, approvalResp, &approvalPayload)
	if approvalPayload.Decision.Status != "approval_required" || approvalPayload.Run.SandboxDecision.Status != "approval_required" {
		t.Fatalf("approval payload = %#v, want approval_required", approvalPayload)
	}

	overrideResp := doJSONRequest(
		t,
		http.DefaultClient,
		http.MethodPost,
		server.URL+"/v1/runs/run_runtime_01/sandbox",
		`{"kind":"command","target":"git push --force","override":true}`,
	)
	defer overrideResp.Body.Close()
	if overrideResp.StatusCode != http.StatusOK {
		t.Fatalf("POST sandbox override status = %d, want %d", overrideResp.StatusCode, http.StatusOK)
	}

	var overridePayload struct {
		Run      store.Run             `json:"run"`
		Decision store.SandboxDecision `json:"decision"`
	}
	decodeJSON(t, overrideResp, &overridePayload)
	if overridePayload.Decision.Status != "overridden" || overridePayload.Run.SandboxDecision.OverrideBy == "" {
		t.Fatalf("override payload = %#v, want overridden with approver", overridePayload)
	}
}
