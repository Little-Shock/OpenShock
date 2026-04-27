package store

import (
	"path/filepath"
	"testing"
	"time"
)

func TestFreshExperienceMetricsMarksZeroInboxCorrectionsAsReady(t *testing.T) {
	t.Setenv("OPENSHOCK_BOOTSTRAP_MODE", "fresh")

	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	snapshot := s.ExperienceMetrics()
	experience, ok := findExperienceMetricsSection(snapshot.Sections, "experience")
	if !ok {
		t.Fatalf("experience section missing: %#v", snapshot.Sections)
	}
	metric, ok := findExperienceMetricByID(experience.Metrics, "inbox-correction")
	if !ok || metric.Status != experienceMetricReady {
		t.Fatalf("inbox-correction metric = %#v, want ready when no open signals exist", metric)
	}
	product, ok := findExperienceMetricsSection(snapshot.Sections, "product")
	if !ok {
		t.Fatalf("product section missing: %#v", snapshot.Sections)
	}
	blockedRecovery, ok := findExperienceMetricByID(product.Metrics, "blocked-recovery")
	if !ok || blockedRecovery.Status != experienceMetricReady {
		t.Fatalf("blocked-recovery metric = %#v, want ready when no blocked incident exists", blockedRecovery)
	}
	retrySuccess, ok := findExperienceMetricByID(product.Metrics, "retry-success")
	if !ok || retrySuccess.Status != experienceMetricReady {
		t.Fatalf("retry-success metric = %#v, want ready when no failed incident exists", retrySuccess)
	}
}

func TestExperienceMetricsUseDurableRecoveryEvents(t *testing.T) {
	t.Setenv("OPENSHOCK_BOOTSTRAP_MODE", "fresh")

	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if _, err := s.UpdateRuntimePairing(RuntimePairingInput{
		RuntimeID:  "shock-main",
		DaemonURL:  "http://127.0.0.1:8090",
		Machine:    "shock-main",
		State:      runtimeStateOnline,
		ReportedAt: time.Now().UTC().Format(time.RFC3339),
	}); err != nil {
		t.Fatalf("UpdateRuntimePairing() error = %v", err)
	}

	created, err := s.CreateIssue(CreateIssueInput{
		Title:    "Recovery metrics proof",
		Summary:  "prove recovery events feed experience metrics",
		Owner:    "Codex Dockmaster",
		Priority: "high",
	})
	if err != nil {
		t.Fatalf("CreateIssue() error = %v", err)
	}
	if _, err := s.MarkRoomConversationInterrupted(created.RoomID, "continue", "codex", "first attempt disconnected"); err != nil {
		t.Fatalf("MarkRoomConversationInterrupted() error = %v", err)
	}
	if _, err := s.RecordRoomConversationRecoveryAttempt(created.RoomID, "test", "retrying from persisted session recovery"); err != nil {
		t.Fatalf("RecordRoomConversationRecoveryAttempt() error = %v", err)
	}
	if _, err := s.RecordRoomConversationRecoveryBlocked(created.RoomID, "test", "temporary blocker before recovery"); err != nil {
		t.Fatalf("RecordRoomConversationRecoveryBlocked() error = %v", err)
	}
	if _, err := s.CompleteRoomConversationRecovery(created.RoomID, "test", "recovered within the same durable recovery chain"); err != nil {
		t.Fatalf("CompleteRoomConversationRecovery() error = %v", err)
	}

	snapshot := s.ExperienceMetrics()
	product, ok := findExperienceMetricsSection(snapshot.Sections, "product")
	if !ok {
		t.Fatalf("product section missing: %#v", snapshot.Sections)
	}
	blockedRecovery, ok := findExperienceMetricByID(product.Metrics, "blocked-recovery")
	if !ok || blockedRecovery.Status != experienceMetricReady || blockedRecovery.Value != "1/1 blocked issues recovered within 24h" {
		t.Fatalf("blocked-recovery metric = %#v, want ready 1/1 from durable recovery events", blockedRecovery)
	}
	retrySuccess, ok := findExperienceMetricByID(product.Metrics, "retry-success")
	if !ok || retrySuccess.Status != experienceMetricReady || retrySuccess.Value != "1/1 failed issues show successful retry continuity" {
		t.Fatalf("retry-success metric = %#v, want ready 1/1 from durable recovery events", retrySuccess)
	}
	repeatInstruction, ok := findExperienceMetricByID(product.Metrics, "repeat-instruction-reduction")
	if !ok || repeatInstruction.Status != experienceMetricReady {
		t.Fatalf("repeat-instruction-reduction metric = %#v, want ready from persisted session continuity hints", repeatInstruction)
	}
}

func TestExperienceMetricsAutoCompleteOperationalFreshOnboarding(t *testing.T) {
	t.Setenv("OPENSHOCK_BOOTSTRAP_MODE", "fresh")

	root := t.TempDir()
	statePath := filepath.Join(root, "data", "state.json")

	s, err := New(statePath, root)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if _, err := s.UpdateRepoBinding(RepoBindingInput{
		Repo:            "Larkspur-Wang/OpenShock",
		RepoURL:         "https://github.com/Larkspur-Wang/OpenShock.git",
		Branch:          "main",
		AuthMode:        "local-git-origin",
		ConnectionReady: true,
	}); err != nil {
		t.Fatalf("UpdateRepoBinding() error = %v", err)
	}
	if _, err := s.UpdateRuntimePairing(RuntimePairingInput{
		RuntimeID: "shock-main",
		DaemonURL: "http://127.0.0.1:8090",
		Machine:   "shock-main",
		State:     runtimeStateOnline,
	}); err != nil {
		t.Fatalf("UpdateRuntimePairing() error = %v", err)
	}

	snapshot := s.ExperienceMetrics()
	product, ok := findExperienceMetricsSection(snapshot.Sections, "product")
	if !ok {
		t.Fatalf("product section missing: %#v", snapshot.Sections)
	}
	onboardingCompletion, ok := findExperienceMetricByID(product.Metrics, "onboarding-completion")
	if !ok || onboardingCompletion.Status != experienceMetricWarning {
		t.Fatalf("onboarding-completion metric = %#v, want warning before template confirmation", onboardingCompletion)
	}

	experience, ok := findExperienceMetricsSection(snapshot.Sections, "experience")
	if !ok {
		t.Fatalf("experience section missing: %#v", snapshot.Sections)
	}
	templateOnboarding, ok := findExperienceMetricByID(experience.Metrics, "template-onboarding")
	if !ok || templateOnboarding.Status != experienceMetricWarning {
		t.Fatalf("template-onboarding metric = %#v, want warning before template confirmation", templateOnboarding)
	}

	if _, _, err := s.UpdateWorkspaceConfig(WorkspaceConfigUpdateInput{
		Onboarding: &WorkspaceOnboardingSnapshot{
			Status:         workspaceOnboardingInProgress,
			TemplateID:     "dev-team",
			CurrentStep:    "runtime",
			CompletedSteps: []string{"workspace-created", "account-ready", "template-selected", "github-choice"},
			ResumeURL:      "/setup",
		},
	}); err != nil {
		t.Fatalf("UpdateWorkspaceConfig(template confirm) error = %v", err)
	}

	snapshot = s.ExperienceMetrics()
	product, ok = findExperienceMetricsSection(snapshot.Sections, "product")
	if !ok {
		t.Fatalf("product section missing after confirmation: %#v", snapshot.Sections)
	}
	onboardingCompletion, ok = findExperienceMetricByID(product.Metrics, "onboarding-completion")
	if !ok || onboardingCompletion.Status != experienceMetricReady {
		t.Fatalf("onboarding-completion metric = %#v, want ready after template confirmation and operational auto-complete", onboardingCompletion)
	}

	experience, ok = findExperienceMetricsSection(snapshot.Sections, "experience")
	if !ok {
		t.Fatalf("experience section missing after confirmation: %#v", snapshot.Sections)
	}
	templateOnboarding, ok = findExperienceMetricByID(experience.Metrics, "template-onboarding")
	if !ok || templateOnboarding.Status != experienceMetricReady {
		t.Fatalf("template-onboarding metric = %#v, want ready after template confirmation and operational auto-complete", templateOnboarding)
	}
}

func findExperienceMetricsSection(sections []ExperienceMetricSection, id string) (ExperienceMetricSection, bool) {
	for _, section := range sections {
		if section.ID == id {
			return section, true
		}
	}
	return ExperienceMetricSection{}, false
}

func findExperienceMetricByID(metrics []ExperienceMetric, id string) (ExperienceMetric, bool) {
	for _, metric := range metrics {
		if metric.ID == id {
			return metric, true
		}
	}
	return ExperienceMetric{}, false
}
