package store

import (
	"path/filepath"
	"testing"
)

func TestUpdateRunSandboxAndEvaluateRestrictedActions(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	_, run, err := s.UpdateRunSandbox("run_runtime_01", SandboxPolicy{
		Profile:         sandboxProfileRestricted,
		AllowedHosts:    []string{"github.com"},
		AllowedCommands: []string{"git status"},
		AllowedTools:    []string{"read_file"},
	}, "Larkspur")
	if err != nil {
		t.Fatalf("UpdateRunSandbox() error = %v", err)
	}
	if run.Sandbox.Profile != sandboxProfileRestricted || len(run.Sandbox.AllowedHosts) != 1 {
		t.Fatalf("updated run sandbox = %#v, want restricted profile + allowlists", run.Sandbox)
	}

	_, deniedRun, deniedDecision, err := s.EvaluateRunSandbox("run_runtime_01", RunSandboxCheckInput{
		Kind:        sandboxActionKindNetwork,
		Target:      "api.openai.com",
		RequestedBy: "Larkspur",
	})
	if err != nil {
		t.Fatalf("EvaluateRunSandbox(network) error = %v", err)
	}
	if deniedDecision.Status != sandboxDecisionDenied || deniedRun.SandboxDecision.Status != sandboxDecisionDenied {
		t.Fatalf("denied decision = %#v / run = %#v, want denied", deniedDecision, deniedRun.SandboxDecision)
	}

	_, approvalRun, approvalDecision, err := s.EvaluateRunSandbox("run_runtime_01", RunSandboxCheckInput{
		Kind:        sandboxActionKindCommand,
		Target:      "git push --force",
		RequestedBy: "Larkspur",
	})
	if err != nil {
		t.Fatalf("EvaluateRunSandbox(command) error = %v", err)
	}
	if approvalDecision.Status != sandboxDecisionApprovalRequired || approvalRun.SandboxDecision.Status != sandboxDecisionApprovalRequired {
		t.Fatalf("approval decision = %#v / run = %#v, want approval_required", approvalDecision, approvalRun.SandboxDecision)
	}

	_, overrideRun, overrideDecision, err := s.EvaluateRunSandbox("run_runtime_01", RunSandboxCheckInput{
		Kind:        sandboxActionKindCommand,
		Target:      "git push --force",
		RequestedBy: "Larkspur",
		Override:    true,
	})
	if err != nil {
		t.Fatalf("EvaluateRunSandbox(override) error = %v", err)
	}
	if overrideDecision.Status != sandboxDecisionOverridden || overrideRun.SandboxDecision.OverrideBy != "Larkspur" {
		t.Fatalf("override decision = %#v / run = %#v, want overridden by Larkspur", overrideDecision, overrideRun.SandboxDecision)
	}
}

func TestCreateIssueInheritsOwnerSandboxPolicy(t *testing.T) {
	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	if _, _, err := s.UpdateAgentProfile("agent-codex-dockmaster", AgentProfileUpdateInput{
		Role:                  "Platform Architect",
		Avatar:                "control-tower",
		Prompt:                "keep live truth first",
		OperatingInstructions: "stay on current head",
		ProviderPreference:    "Codex CLI",
		ModelPreference:       "gpt-5.3-codex",
		RecallPolicy:          "governed-first",
		RuntimePreference:     "shock-main",
		MemorySpaces:          []string{"workspace", "issue-room"},
		Sandbox: &SandboxPolicy{
			Profile:         sandboxProfileRestricted,
			AllowedHosts:    []string{"github.com"},
			AllowedCommands: []string{"git status"},
			AllowedTools:    []string{"read_file"},
		},
		UpdatedBy: "Larkspur",
	}); err != nil {
		t.Fatalf("UpdateAgentProfile() error = %v", err)
	}

	created, err := s.CreateIssue(CreateIssueInput{
		Title:    "Sandbox inheritance",
		Summary:  "verify run inherits owner policy",
		Owner:    "Codex Dockmaster",
		Priority: "high",
	})
	if err != nil {
		t.Fatalf("CreateIssue() error = %v", err)
	}

	snapshot := created.State
	var found *Run
	for index := range snapshot.Runs {
		if snapshot.Runs[index].ID == created.RunID {
			found = &snapshot.Runs[index]
			break
		}
	}
	if found == nil {
		t.Fatalf("created run %q missing", created.RunID)
	}
	if found.Sandbox.Profile != sandboxProfileRestricted || len(found.Sandbox.AllowedCommands) != 1 || found.Sandbox.AllowedCommands[0] != "git status" {
		t.Fatalf("created run sandbox = %#v, want inherited owner policy", found.Sandbox)
	}
}
