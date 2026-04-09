package store

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

const (
	sandboxProfileTrusted    = "trusted"
	sandboxProfileRestricted = "restricted"

	sandboxDecisionIdle             = "idle"
	sandboxDecisionAllowed          = "allowed"
	sandboxDecisionDenied           = "denied"
	sandboxDecisionApprovalRequired = "approval_required"
	sandboxDecisionOverridden       = "overridden"

	sandboxActionKindCommand = "command"
	sandboxActionKindNetwork = "network"
	sandboxActionKindTool    = "tool"
)

var (
	ErrSandboxProfileInvalid         = errors.New("sandbox profile is invalid")
	ErrSandboxActionKindInvalid      = errors.New("sandbox action kind is invalid")
	ErrSandboxActionTargetRequired   = errors.New("sandbox action target is required")
	ErrSandboxRunNotFound            = errors.New("sandbox run not found")
	ErrSandboxOverrideRequiresReview = errors.New("sandbox override requires an approval_required action")
)

type RunSandboxCheckInput struct {
	Kind        string
	Target      string
	RequestedBy string
	Override    bool
}

func defaultSandboxPolicy(now string) SandboxPolicy {
	return SandboxPolicy{
		Profile:   sandboxProfileTrusted,
		UpdatedAt: now,
		UpdatedBy: "System",
	}
}

func defaultSandboxDecision() SandboxDecision {
	return SandboxDecision{Status: sandboxDecisionIdle}
}

func syncSandboxPolicyDefaults(policy *SandboxPolicy) {
	if policy == nil {
		return
	}
	if strings.TrimSpace(policy.Profile) == "" {
		policy.Profile = sandboxProfileTrusted
	}
	policy.AllowedHosts = normalizeSandboxAllowlist(policy.AllowedHosts)
	policy.AllowedCommands = normalizeSandboxAllowlist(policy.AllowedCommands)
	policy.AllowedTools = normalizeSandboxAllowlist(policy.AllowedTools)
}

func syncSandboxDecisionDefaults(decision *SandboxDecision) {
	if decision == nil {
		return
	}
	if strings.TrimSpace(decision.Status) == "" {
		decision.Status = sandboxDecisionIdle
	}
}

func normalizeSandboxProfile(value string) (string, error) {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case sandboxProfileTrusted:
		return sandboxProfileTrusted, nil
	case sandboxProfileRestricted:
		return sandboxProfileRestricted, nil
	default:
		return "", ErrSandboxProfileInvalid
	}
}

func normalizeSandboxActionKind(value string) (string, error) {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case sandboxActionKindCommand:
		return sandboxActionKindCommand, nil
	case sandboxActionKindNetwork:
		return sandboxActionKindNetwork, nil
	case sandboxActionKindTool:
		return sandboxActionKindTool, nil
	default:
		return "", ErrSandboxActionKindInvalid
	}
}

func normalizeSandboxAllowlist(values []string) []string {
	seen := map[string]bool{}
	normalized := make([]string, 0, len(values))
	for _, value := range values {
		item := strings.TrimSpace(value)
		if item == "" {
			continue
		}
		lower := strings.ToLower(item)
		if seen[lower] {
			continue
		}
		seen[lower] = true
		normalized = append(normalized, item)
	}
	return normalized
}

func normalizeSandboxPolicyInput(input SandboxPolicy, fallback SandboxPolicy, updatedBy string) (SandboxPolicy, error) {
	policy := fallback

	profile := strings.TrimSpace(input.Profile)
	if profile == "" {
		profile = fallback.Profile
	}
	normalizedProfile, err := normalizeSandboxProfile(profile)
	if err != nil {
		return SandboxPolicy{}, err
	}

	policy.Profile = normalizedProfile
	if input.AllowedHosts != nil {
		policy.AllowedHosts = normalizeSandboxAllowlist(input.AllowedHosts)
	}
	if input.AllowedCommands != nil {
		policy.AllowedCommands = normalizeSandboxAllowlist(input.AllowedCommands)
	}
	if input.AllowedTools != nil {
		policy.AllowedTools = normalizeSandboxAllowlist(input.AllowedTools)
	}
	policy.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	policy.UpdatedBy = defaultString(strings.TrimSpace(updatedBy), "System")
	return policy, nil
}

func sandboxPolicySummary(policy SandboxPolicy) string {
	parts := []string{policy.Profile}
	if len(policy.AllowedHosts) > 0 {
		parts = append(parts, fmt.Sprintf("hosts:%s", strings.Join(policy.AllowedHosts, ", ")))
	}
	if len(policy.AllowedCommands) > 0 {
		parts = append(parts, fmt.Sprintf("commands:%s", strings.Join(policy.AllowedCommands, ", ")))
	}
	if len(policy.AllowedTools) > 0 {
		parts = append(parts, fmt.Sprintf("tools:%s", strings.Join(policy.AllowedTools, ", ")))
	}
	return strings.Join(parts, " / ")
}

func sandboxActionAllowed(policy SandboxPolicy, kind, target string) bool {
	if strings.TrimSpace(policy.Profile) != sandboxProfileRestricted {
		return true
	}

	switch kind {
	case sandboxActionKindNetwork:
		return sandboxAllowlistContains(policy.AllowedHosts, target)
	case sandboxActionKindCommand:
		return sandboxAllowlistContains(policy.AllowedCommands, target)
	case sandboxActionKindTool:
		return sandboxAllowlistContains(policy.AllowedTools, target)
	default:
		return false
	}
}

func sandboxAllowlistContains(items []string, target string) bool {
	target = strings.TrimSpace(target)
	for _, item := range items {
		if strings.EqualFold(strings.TrimSpace(item), target) {
			return true
		}
	}
	return false
}

func buildSandboxDecision(policy SandboxPolicy, kind, target, requestedBy string, override bool) SandboxDecision {
	now := time.Now().UTC().Format(time.RFC3339)
	decision := SandboxDecision{
		Status:      sandboxDecisionAllowed,
		Kind:        kind,
		Target:      target,
		RequestedBy: defaultString(strings.TrimSpace(requestedBy), "System"),
		CheckedAt:   now,
	}

	if strings.TrimSpace(policy.Profile) != sandboxProfileRestricted {
		decision.Reason = "当前 run 仍处于 trusted profile；这次动作不触发 restricted sandbox gate。"
		return decision
	}

	if sandboxActionAllowed(policy, kind, target) {
		decision.Reason = "当前动作命中 restricted allowlist，可以继续执行。"
		return decision
	}

	switch kind {
	case sandboxActionKindNetwork:
		decision.Status = sandboxDecisionDenied
		decision.Reason = "restricted sandbox 未允许这个 network target；先补 host allowlist，再 retry。"
		decision.RetryHint = "更新 run / agent / workspace 的 allowed hosts 后重试。"
	case sandboxActionKindCommand, sandboxActionKindTool:
		if override {
			decision.Status = sandboxDecisionOverridden
			decision.OverrideBy = defaultString(strings.TrimSpace(requestedBy), "System")
			decision.Reason = "人类已批准本次 restricted action override；可以按同一 target 重试。"
			decision.RetryHint = "沿当前 run 重新触发这次动作；只对这次 override 生效。"
			return decision
		}
		decision.Status = sandboxDecisionApprovalRequired
		decision.Reason = "restricted sandbox 没有放行这个 action；需要 owner 显式批准后再 retry。"
		decision.RetryHint = "保持 target 不变，由具备 workspace.manage 的人批准 override 后重试。"
	default:
		decision.Status = sandboxDecisionDenied
		decision.Reason = "当前动作不在 sandbox policy 允许的 action kind 列表里。"
		decision.RetryHint = "改写动作或更新 policy 后再重试。"
	}

	return decision
}

func (s *Store) UpdateRunSandbox(runID string, input SandboxPolicy, updatedBy string) (State, Run, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	runIndex := -1
	for index := range s.state.Runs {
		if s.state.Runs[index].ID == runID {
			runIndex = index
			break
		}
	}
	if runIndex == -1 {
		return State{}, Run{}, ErrSandboxRunNotFound
	}

	policy, err := normalizeSandboxPolicyInput(input, s.state.Runs[runIndex].Sandbox, updatedBy)
	if err != nil {
		return State{}, Run{}, err
	}

	s.state.Runs[runIndex].Sandbox = policy
	s.state.Runs[runIndex].SandboxDecision = defaultSandboxDecision()
	if err := s.persistLocked(); err != nil {
		return State{}, Run{}, err
	}

	nextState := cloneState(s.state)
	for _, run := range nextState.Runs {
		if run.ID == runID {
			return nextState, run, nil
		}
	}
	return nextState, Run{}, ErrSandboxRunNotFound
}

func (s *Store) EvaluateRunSandbox(runID string, input RunSandboxCheckInput) (State, Run, SandboxDecision, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	runIndex := -1
	for index := range s.state.Runs {
		if s.state.Runs[index].ID == runID {
			runIndex = index
			break
		}
	}
	if runIndex == -1 {
		return State{}, Run{}, SandboxDecision{}, ErrSandboxRunNotFound
	}

	kind, err := normalizeSandboxActionKind(input.Kind)
	if err != nil {
		return State{}, Run{}, SandboxDecision{}, err
	}
	target := strings.TrimSpace(input.Target)
	if target == "" {
		return State{}, Run{}, SandboxDecision{}, ErrSandboxActionTargetRequired
	}

	current := s.state.Runs[runIndex].SandboxDecision
	if input.Override && (current.Status != sandboxDecisionApprovalRequired || current.Kind != kind || !strings.EqualFold(strings.TrimSpace(current.Target), target)) {
		return State{}, Run{}, SandboxDecision{}, ErrSandboxOverrideRequiresReview
	}

	decision := buildSandboxDecision(s.state.Runs[runIndex].Sandbox, kind, target, input.RequestedBy, input.Override)
	s.state.Runs[runIndex].SandboxDecision = decision
	now := shortClock()
	switch decision.Status {
	case sandboxDecisionDenied:
		s.state.Runs[runIndex].Stderr = append(s.state.Runs[runIndex].Stderr, fmt.Sprintf("[%s] sandbox denied %s: %s", now, kind, target))
		s.state.Runs[runIndex].NextAction = decision.RetryHint
	case sandboxDecisionApprovalRequired:
		s.state.Runs[runIndex].Stdout = append(s.state.Runs[runIndex].Stdout, fmt.Sprintf("[%s] sandbox approval_required %s: %s", now, kind, target))
		s.state.Runs[runIndex].NextAction = decision.RetryHint
	case sandboxDecisionOverridden:
		s.state.Runs[runIndex].Stdout = append(s.state.Runs[runIndex].Stdout, fmt.Sprintf("[%s] sandbox override approved %s: %s", now, kind, target))
		s.state.Runs[runIndex].NextAction = decision.RetryHint
	default:
		s.state.Runs[runIndex].Stdout = append(s.state.Runs[runIndex].Stdout, fmt.Sprintf("[%s] sandbox allowed %s: %s", now, kind, target))
	}
	s.state.Runs[runIndex].Timeline = append(s.state.Runs[runIndex].Timeline, RunEvent{
		ID:    fmt.Sprintf("%s-ev-%d", s.state.Runs[runIndex].ID, len(s.state.Runs[runIndex].Timeline)+1),
		Label: fmt.Sprintf("Sandbox %s", decision.Status),
		At:    now,
		Tone:  sandboxDecisionTone(decision.Status),
	})

	if err := s.persistLocked(); err != nil {
		return State{}, Run{}, SandboxDecision{}, err
	}

	nextState := cloneState(s.state)
	for _, run := range nextState.Runs {
		if run.ID == runID {
			return nextState, run, decision, nil
		}
	}
	return nextState, Run{}, decision, ErrSandboxRunNotFound
}

func sandboxDecisionTone(status string) string {
	switch status {
	case sandboxDecisionDenied, sandboxDecisionApprovalRequired:
		return "pink"
	case sandboxDecisionOverridden:
		return "yellow"
	default:
		return "lime"
	}
}
