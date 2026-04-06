export const MESSAGE_TYPES = new Set([
  "dispatch",
  "status_report",
  "handoff_package",
  "challenge",
  "merge_request",
  "blocker_escalation",
  "feedback_ingest",
  "shared_truth_proposal",
  "conflict_resolution"
]);

export const HUMAN_GATES = Object.freeze({
  ARCHITECTURE: "architecture-level-change",
  EXTERNAL_INTERFACE: "external-interface-change",
  PR_MERGE: "pr-merge",
  CROSS_TOPIC_TRUTH_REWRITE: "cross-topic-shared-truth-rewrite"
});

export const HUMAN_GATE_SET = new Set(Object.values(HUMAN_GATES));

export const AGENT_ROLES = new Set(["lead", "worker", "human", "system"]);

export const MESSAGE_STATE = Object.freeze({
  RECEIVED: "received",
  PENDING_ACCEPT: "pending_accept",
  ACTIVE: "active",
  HANDOFF_PENDING: "handoff_pending",
  MERGE_CANDIDATE: "merge_candidate",
  WAITING_GATE: "waiting_human_gate",
  BLOCKED_CONFLICT: "blocked_conflict",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CLOSED: "closed"
});

export function normalizeGate(gate) {
  if (typeof gate !== "string") {
    return null;
  }
  const trimmed = gate.trim().toLowerCase();
  if (HUMAN_GATE_SET.has(trimmed)) {
    return trimmed;
  }
  return null;
}

export function parseGateList(payload) {
  const gates = new Set();
  const gateCandidates = Array.isArray(payload?.gates) ? payload.gates : [];
  for (const gate of gateCandidates) {
    const normalized = normalizeGate(gate);
    if (normalized) {
      gates.add(normalized);
    }
  }
  return gates;
}

