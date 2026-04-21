package store

import (
	"strings"
	"testing"
)

func TestBuildGovernanceSuggestedHandoffCarriesActiveHrefLabel(t *testing.T) {
	state := State{
		Agents: []Agent{
			{ID: "agent-codex-dockmaster", Name: "Codex Dockmaster"},
			{ID: "agent-claude-review-runner", Name: "Claude Review Runner"},
		},
	}
	template := governanceTemplateFor("dev-team")
	issue := Issue{Key: "OPS-42"}
	room := Room{ID: "room-runtime"}
	handoff := AgentHandoff{
		ID:          "handoff-runtime",
		Status:      "acknowledged",
		IssueKey:    issue.Key,
		RoomID:      room.ID,
		FromAgentID: "agent-codex-dockmaster",
		FromAgent:   "Codex Dockmaster",
		ToAgentID:   "agent-claude-review-runner",
		ToAgent:     "Claude Review Runner",
		Title:       "把 reviewer lane 接住",
		Summary:     "继续推进当前交接。",
	}

	got := buildGovernanceSuggestedHandoff(state, template, governanceFocus{
		Issue:         &issue,
		Room:          &room,
		LatestHandoff: &handoff,
	})

	if got.Status != "active" {
		t.Fatalf("suggested handoff status = %q, want active", got.Status)
	}
	if got.Href != mailboxInboxHref(handoff.ID, room.ID) {
		t.Fatalf("suggested handoff href = %q, want mailbox focus href", got.Href)
	}
	if got.HrefLabel != "收件箱定位" {
		t.Fatalf("suggested handoff href label = %q, want explicit active handoff label", got.HrefLabel)
	}
}

func TestWorkspaceGovernanceNextRouteHrefLabelFailsClosedForUnknownHref(t *testing.T) {
	if got := WorkspaceGovernanceNextRouteHrefLabel("done", "/external-review/opaque"); got != "" {
		t.Fatalf("unknown next route href label = %q, want empty fail-closed label", got)
	}
}

func TestBuildGovernanceRulesUsesCustomerFacingLabels(t *testing.T) {
	rules := buildGovernanceRules(governanceFocus{}, WorkspaceGovernanceStats{}, WorkspaceHumanOverride{})
	labels := map[string]string{}
	for _, rule := range rules {
		labels[rule.ID] = rule.Label
	}

	if labels["formal-handoff"] != "交接" {
		t.Fatalf("formal-handoff label = %q, want 交接", labels["formal-handoff"])
	}
	if labels["review-gate"] != "评审" {
		t.Fatalf("review-gate label = %q, want 评审", labels["review-gate"])
	}
	if labels["test-gate"] != "验证" {
		t.Fatalf("test-gate label = %q, want 验证", labels["test-gate"])
	}
	if labels["blocked-escalation"] != "阻塞" {
		t.Fatalf("blocked-escalation label = %q, want 阻塞", labels["blocked-escalation"])
	}
	if labels["human-override"] != "人工接管" {
		t.Fatalf("human-override label = %q, want 人工接管", labels["human-override"])
	}
}

func TestHydrateWorkspaceGovernanceUsesCustomerFacingCopy(t *testing.T) {
	state := seedState()
	workspace := state.Workspace

	hydrateWorkspaceGovernance(&workspace, &state)

	texts := []string{
		workspace.Governance.Summary,
		workspace.Governance.RoutingPolicy.Summary,
		workspace.Governance.RoutingPolicy.SuggestedHandoff.Reason,
		workspace.Governance.EscalationSLA.Summary,
		workspace.Governance.NotificationPolicy.Summary,
		workspace.Governance.ResponseAggregation.Summary,
		workspace.Governance.HumanOverride.Summary,
	}
	for _, lane := range workspace.Governance.TeamTopology {
		texts = append(texts, lane.Role, lane.Lane, lane.Summary)
	}
	for _, rule := range workspace.Governance.HandoffRules {
		texts = append(texts, rule.Label, rule.Summary)
	}
	for _, rule := range workspace.Governance.RoutingPolicy.Rules {
		texts = append(texts, rule.Policy, rule.Summary)
	}
	for _, entry := range workspace.Governance.EscalationSLA.Queue {
		texts = append(texts, entry.Source, entry.Summary, entry.NextStep)
	}
	for _, entry := range workspace.Governance.EscalationSLA.Rollup {
		texts = append(texts, entry.LatestSource, entry.LatestSummary, entry.NextRouteSummary)
	}
	for _, entry := range workspace.Governance.ResponseAggregation.AuditTrail {
		texts = append(texts, entry.Label, entry.Summary)
	}
	for _, step := range workspace.Governance.Walkthrough {
		texts = append(texts, step.Label, step.Summary, step.Detail)
	}

	blockedTerms := []string{
		"governed",
		"routing matrix",
		"routing policy",
		"review gate",
		"handoff ledger",
		"mailbox handoff",
		"inbox blocker",
		"exact-head verdict",
		"Issue Truth",
		"Final Response",
		"Delivery Closeout",
		"live governance evidence",
		"治理阻塞",
		"治理 lane",
		"response aggregation",
		"human override",
	}
	for _, text := range texts {
		for _, term := range blockedTerms {
			if strings.Contains(text, term) {
				t.Fatalf("customer-facing text %q still contains internal term %q", text, term)
			}
		}
	}

	labels := []string{}
	for _, step := range workspace.Governance.Walkthrough {
		labels = append(labels, step.Label)
	}
	if strings.Join(labels, ",") != "事项,交接,评审,验证,最终回复" {
		t.Fatalf("walkthrough labels = %#v, want customer-facing step labels", labels)
	}
}
