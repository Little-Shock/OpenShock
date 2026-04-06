import {
  AGENT_ROLES,
  HUMAN_GATES,
  MESSAGE_STATE,
  MESSAGE_TYPES,
  normalizeGate,
  parseGateList
} from "./protocol.js";
import { assertOrThrow, CoordinatorError } from "./errors.js";
import { deepClone, deepMerge, generateId, nowIso } from "./utils.js";

const DELIVERY_STATE_GRAPH = Object.freeze({
  not_started: ["not_started", "awaiting_merge_gate", "pr_ready", "failed"],
  awaiting_merge_gate: ["awaiting_merge_gate", "pr_ready", "failed"],
  pr_ready: ["pr_ready", "merged", "failed"],
  merged: ["merged"],
  failed: ["failed", "awaiting_merge_gate", "pr_ready"]
});

const PR_WRITEBACK_STATE_GRAPH = Object.freeze({
  not_started: ["not_started", "pr_ready", "merged", "failed"],
  pr_ready: ["pr_ready", "merged", "failed"],
  merged: ["merged"],
  failed: ["failed", "pr_ready"]
});

function createEmptyTopic({ topicId, goal, constraints }) {
  const now = nowIso();
  return {
    topicId,
    revision: 1,
    truth: {
      goal,
      constraints: constraints ?? [],
      plan: null,
      taskAllocation: [],
      decisions: [],
      mergeIntent: null,
      stableArtifacts: [],
      deliveryState: {
        state: "not_started",
        prUrl: null,
        lastUpdatedAt: now
      },
      prWriteback: {
        state: "not_started",
        prUrl: null,
        lastUpdatedAt: now
      }
    },
    agents: new Map(),
    messages: new Map(),
    routes: new Map(),
    dispatches: new Map(),
    handoffs: new Map(),
    conflicts: new Map(),
    approvals: new Map(),
    holdsByMessage: new Map(),
    blockers: new Map(),
    feedback: [],
    riskFlags: new Set(),
    history: [],
    updatedAt: now
  };
}

function keepHistory(topic, event) {
  topic.history.push(event);
  if (topic.history.length > 2000) {
    topic.history.shift();
  }
}

function routeKey(message) {
  if (typeof message.targetScope === "string" && message.targetScope.trim()) {
    return message.targetScope.trim();
  }
  return "topic";
}

function collectDynamicGates(message) {
  const gates = parseGateList(message.payload);
  if (message.type === "merge_request") {
    gates.add(HUMAN_GATES.PR_MERGE);
  }
  if (message.payload?.crossTopicRewrite === true) {
    gates.add(HUMAN_GATES.CROSS_TOPIC_TRUTH_REWRITE);
  }
  if (message.payload?.changeClass === "architecture") {
    gates.add(HUMAN_GATES.ARCHITECTURE);
  }
  if (message.payload?.changeClass === "external_interface") {
    gates.add(HUMAN_GATES.EXTERNAL_INTERFACE);
  }
  return gates;
}

function conflictTouchesScope(conflict, scope) {
  if (!scope || !Array.isArray(conflict.scopes) || conflict.scopes.length === 0) {
    return true;
  }
  return conflict.scopes.includes(scope);
}

function parseHandoffTarget(targetScope) {
  if (typeof targetScope !== "string" || targetScope.trim().length === 0) {
    return {
      toAgentId: null,
      toRole: null
    };
  }
  const trimmed = targetScope.trim();
  if (trimmed.startsWith("agent:")) {
    const toAgentId = trimmed.slice("agent:".length).trim();
    return {
      toAgentId: toAgentId.length > 0 ? toAgentId : null,
      toRole: null
    };
  }
  if (["lead", "worker", "human", "system"].includes(trimmed)) {
    return {
      toAgentId: null,
      toRole: trimmed
    };
  }
  return {
    toAgentId: null,
    toRole: null
  };
}

function collectHandoffReceivers(topic, handoff) {
  if (handoff.toAgentId) {
    return new Set([handoff.toAgentId]);
  }
  if (handoff.toRole) {
    const out = new Set();
    for (const agent of topic.agents.values()) {
      if (agent.role === handoff.toRole) {
        out.add(agent.agentId);
      }
    }
    return out;
  }
  return new Set();
}

function hasLeadRole(topic, agentId) {
  const agent = topic.agents.get(agentId);
  return agent?.role === "lead";
}

function requireWriteActor(topic, agentId, input = {}) {
  const codePrefix = typeof input.codePrefix === "string" && input.codePrefix.trim() ? input.codePrefix.trim() : "actor";
  const expectedRole = typeof input.expectedRole === "string" && input.expectedRole.trim() ? input.expectedRole.trim() : null;
  const allowedRoles =
    Array.isArray(input.allowedRoles) && input.allowedRoles.length > 0 ? input.allowedRoles : expectedRole ? [expectedRole] : null;

  const actor = topic.agents.get(agentId);
  assertOrThrow(actor, `${codePrefix}_not_registered`, `${codePrefix} ${agentId} is not registered`, {
    agentId
  });
  if (expectedRole) {
    assertOrThrow(actor.role === expectedRole, `${codePrefix}_role_mismatch`, `${codePrefix} ${agentId} role mismatch`, {
      agentId,
      registeredRole: actor.role,
      providedRole: expectedRole
    });
  } else if (allowedRoles) {
    assertOrThrow(allowedRoles.includes(actor.role), `${codePrefix}_role_mismatch`, `${codePrefix} ${agentId} role mismatch`, {
      agentId,
      registeredRole: actor.role,
      allowedRoles
    });
  }
  assertOrThrow(actor.status === "active", `${codePrefix}_inactive`, `${codePrefix} ${agentId} must be active`, {
    agentId,
    status: actor.status
  });
  return actor;
}

function requireRegisteredActor(topic, agentId, role, codePrefix = "actor") {
  return requireWriteActor(topic, agentId, {
    codePrefix,
    expectedRole: role
  });
}

function requireActiveActorWithAllowedRoles(topic, agentId, allowedRoles, codePrefix = "actor") {
  return requireWriteActor(topic, agentId, {
    codePrefix,
    allowedRoles
  });
}

function isAllArtifactsResolved(handoff, resolvedArtifacts) {
  const expected = Array.isArray(handoff.referencedArtifacts) ? handoff.referencedArtifacts : [];
  if (expected.length === 0) {
    return true;
  }
  if (!Array.isArray(resolvedArtifacts) || resolvedArtifacts.length === 0) {
    return false;
  }
  const resolved = new Set(resolvedArtifacts);
  return expected.every((artifactId) => resolved.has(artifactId));
}

function normalizeArtifactRefs(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  }
  if (Array.isArray(fallback)) {
    return fallback.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  }
  return [];
}

function getOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function upsertMergeLifecycleTruth(topic, patch = {}) {
  const current =
    topic.truth.mergeIntent && typeof topic.truth.mergeIntent === "object" ? deepClone(topic.truth.mergeIntent) : {};
  const now = nowIso();
  const next = {
    ...current,
    ...patch
  };

  next.stage =
    getOptionalString(patch.stage) ??
    getOptionalString(current.stage) ??
    getOptionalString(topic.truth.deliveryState?.state) ??
    "not_started";

  const runId = getOptionalString(patch.runId) ?? getOptionalString(current.runId);
  if (runId) {
    next.runId = runId;
  } else {
    delete next.runId;
  }

  const checkpointRef = getOptionalString(patch.checkpointRef) ?? getOptionalString(current.checkpointRef);
  if (checkpointRef) {
    next.checkpointRef = checkpointRef;
  } else {
    delete next.checkpointRef;
  }

  next.artifactRefs = normalizeArtifactRefs(
    patch.artifactRefs,
    normalizeArtifactRefs(current.artifactRefs, topic.truth.stableArtifacts ?? [])
  );
  next.deliveryState = topic.truth.deliveryState.state;
  next.prWritebackState = topic.truth.prWriteback.state;
  next.lastTransitionAt = now;
  topic.truth.mergeIntent = next;
}

function normalizeMessage(topicId, messageInput) {
  assertOrThrow(messageInput && typeof messageInput === "object", "invalid_message", "message must be an object");
  assertOrThrow(typeof messageInput.type === "string", "invalid_message", "message.type is required");
  assertOrThrow(MESSAGE_TYPES.has(messageInput.type), "invalid_message_type", `unsupported message type: ${messageInput.type}`);
  assertOrThrow(typeof messageInput.sourceAgentId === "string" && messageInput.sourceAgentId.length > 0, "invalid_message", "sourceAgentId is required");
  assertOrThrow(typeof messageInput.sourceRole === "string", "invalid_message", "sourceRole is required");
  assertOrThrow(AGENT_ROLES.has(messageInput.sourceRole), "invalid_source_role", `unsupported sourceRole: ${messageInput.sourceRole}`);

  return {
    messageId: messageInput.messageId ?? generateId("msg"),
    topicId,
    type: messageInput.type,
    sourceAgentId: messageInput.sourceAgentId,
    sourceRole: messageInput.sourceRole,
    targetScope: messageInput.targetScope ?? "topic",
    laneId: messageInput.laneId ?? null,
    runId: messageInput.runId ?? null,
    referencedArtifacts: Array.isArray(messageInput.referencedArtifacts)
      ? messageInput.referencedArtifacts
      : [],
    truthRevision:
      messageInput.truthRevision === undefined || messageInput.truthRevision === null
        ? null
        : Number(messageInput.truthRevision),
    payload: messageInput.payload ?? {},
    createdAt: nowIso(),
    state: MESSAGE_STATE.RECEIVED
  };
}

export class ServerCoordinator {
  constructor(options = {}) {
    this.topics = new Map();
    this.escalationMs = Number(options.escalationMs ?? 120000);
    this.conflictSweepOnRead = options.conflictSweepOnRead ?? true;
  }

  createTopic(input) {
    assertOrThrow(input && typeof input === "object", "invalid_topic", "topic input is required");
    assertOrThrow(typeof input.topicId === "string" && input.topicId.length > 0, "invalid_topic", "topicId is required");
    assertOrThrow(typeof input.goal === "string" && input.goal.length > 0, "invalid_topic", "goal is required");
    assertOrThrow(!this.topics.has(input.topicId), "topic_exists", `topic ${input.topicId} already exists`);

    const topic = createEmptyTopic(input);
    this.topics.set(topic.topicId, topic);
    keepHistory(topic, {
      event: "topic_created",
      at: topic.updatedAt,
      topicId: topic.topicId,
      revision: topic.revision
    });
    return this.getTopicOverview(topic.topicId);
  }

  registerAgent(topicId, input) {
    const topic = this.requireTopic(topicId);
    assertOrThrow(input && typeof input === "object", "invalid_agent", "agent payload is required");
    assertOrThrow(typeof input.agentId === "string" && input.agentId.length > 0, "invalid_agent", "agentId is required");
    assertOrThrow(typeof input.role === "string" && AGENT_ROLES.has(input.role), "invalid_agent", "role must be one of lead/worker/human/system");

    topic.agents.set(input.agentId, {
      agentId: input.agentId,
      role: input.role,
      laneId: input.laneId ?? null,
      status: input.status ?? "idle",
      lastSeenAt: nowIso()
    });
    topic.updatedAt = nowIso();
    keepHistory(topic, {
      event: "agent_registered",
      at: topic.updatedAt,
      agentId: input.agentId,
      role: input.role
    });
    return this.getTopicOverview(topicId);
  }

  ingestMessage(topicId, messageInput) {
    const topic = this.requireTopic(topicId);
    this.sweepConflictEscalations(topic);
    const message = normalizeMessage(topicId, messageInput);
    const actor = requireRegisteredActor(topic, message.sourceAgentId, message.sourceRole);
    actor.lastSeenAt = message.createdAt;

    topic.messages.set(message.messageId, message);
    this.recordRoute(topic, message);
    keepHistory(topic, {
      event: "message_received",
      at: message.createdAt,
      type: message.type,
      messageId: message.messageId,
      sourceAgentId: message.sourceAgentId
    });

    const result = this.applyMessageSemantics(topic, message);
    topic.updatedAt = nowIso();

    return {
      messageId: message.messageId,
      state: message.state,
      result,
      revision: topic.revision,
      updatedAt: topic.updatedAt
    };
  }

  applyHumanDecision(topicId, holdId, input) {
    const topic = this.requireTopic(topicId);
    assertOrThrow(typeof holdId === "string" && holdId.length > 0, "invalid_hold", "holdId is required");
    const hold = topic.approvals.get(holdId);
    assertOrThrow(hold, "hold_not_found", `hold ${holdId} not found`);
    assertOrThrow(hold.status === "pending", "hold_finalized", `hold ${holdId} already finalized`);

    assertOrThrow(input && typeof input === "object", "invalid_decision", "decision payload is required");
    assertOrThrow(typeof input.decider === "string" && input.decider.trim().length > 0, "invalid_decision", "decider is required");
    assertOrThrow(typeof input.approve === "boolean", "invalid_decision", "approve must be boolean");
    const interventionPoint = normalizeGate(input.interventionPoint);
    assertOrThrow(interventionPoint, "invalid_decision", "interventionPoint is required");
    assertOrThrow(interventionPoint === hold.gate, "decision_intervention_mismatch", "interventionPoint must match hold gate", {
      holdId,
      holdGate: hold.gate,
      interventionPoint
    });
    const decider = input.decider.trim();
    requireRegisteredActor(topic, decider, "human", "decision_actor");

    hold.status = input.approve ? "approved" : "rejected";
    hold.decider = decider;
    hold.decidedAt = nowIso();
    keepHistory(topic, {
      event: "approval_decision",
      at: hold.decidedAt,
      holdId,
      decision: hold.status,
      decider: hold.decider
    });

    const message = topic.messages.get(hold.messageId);
    if (message) {
      if (!input.approve) {
        message.state = MESSAGE_STATE.REJECTED;
        topic.blockers.set(`approval_rejected:${holdId}`, {
          blockerId: `approval_rejected:${holdId}`,
          reason: `human rejected ${hold.gate}`,
          messageId: message.messageId,
          createdAt: hold.decidedAt
        });
      } else if (this.allHoldsApproved(topic, hold.messageId)) {
        this.releaseMessageAfterApprovals(topic, message);
      }
    }
    topic.updatedAt = nowIso();
    return {
      holdId,
      status: hold.status,
      messageId: hold.messageId,
      messageState: message?.state ?? null,
      revision: topic.revision
    };
  }

  getTopicOverview(topicId) {
    const topic = this.requireTopic(topicId);
    if (this.conflictSweepOnRead) {
      this.sweepConflictEscalations(topic);
    }
    return {
      topicId: topic.topicId,
      revision: topic.revision,
      truth: deepClone(topic.truth),
      agents: Array.from(topic.agents.values()).map((agent) => deepClone(agent)),
      openConflicts: Array.from(topic.conflicts.values())
        .filter((conflict) => conflict.status === "unresolved")
        .map((conflict) => deepClone(conflict)),
      pendingApprovals: Array.from(topic.approvals.values())
        .filter((hold) => hold.status === "pending")
        .map((hold) => deepClone(hold)),
      blockers: Array.from(topic.blockers.values()).map((blocker) => deepClone(blocker)),
      updatedAt: topic.updatedAt
    };
  }

  getCoarseObservability(topicId) {
    const topic = this.requireTopic(topicId);
    if (this.conflictSweepOnRead) {
      this.sweepConflictEscalations(topic);
    }
    const activeAgents = [];
    const blockedAgents = [];
    for (const agent of topic.agents.values()) {
      if (agent.status === "blocked") {
        blockedAgents.push(agent.agentId);
      } else {
        activeAgents.push(agent.agentId);
      }
    }
    return {
      topicId: topic.topicId,
      revision: topic.revision,
      activeAgents,
      blockedAgents,
      openConflictCount: Array.from(topic.conflicts.values()).filter((c) => c.status === "unresolved").length,
      pendingApprovalCount: Array.from(topic.approvals.values()).filter((h) => h.status === "pending").length,
      blockerCount: topic.blockers.size,
      riskFlags: Array.from(topic.riskFlags.values()),
      deliveryState: deepClone(topic.truth.deliveryState),
      updatedAt: topic.updatedAt
    };
  }

  listTopics() {
    return Array.from(this.topics.values()).map((topic) => ({
      topicId: topic.topicId,
      revision: topic.revision,
      goal: topic.truth.goal,
      constraints: deepClone(topic.truth.constraints),
      deliveryState: deepClone(topic.truth.deliveryState),
      prWriteback: deepClone(topic.truth.prWriteback),
      taskAllocation: deepClone(topic.truth.taskAllocation ?? []),
      mergeIntent: deepClone(topic.truth.mergeIntent ?? null),
      stableArtifacts: deepClone(topic.truth.stableArtifacts ?? []),
      actorCount: topic.agents.size,
      updatedAt: topic.updatedAt
    }));
  }

  listActors(topicId) {
    const topic = this.requireTopic(topicId);
    return Array.from(topic.agents.values()).map((agent) => deepClone(agent));
  }

  getActor(topicId, actorId) {
    const topic = this.requireTopic(topicId);
    assertOrThrow(typeof actorId === "string" && actorId.length > 0, "invalid_actor_id", "actorId is required");
    const actor = topic.agents.get(actorId);
    assertOrThrow(actor, "actor_not_found", `actor ${actorId} not found`);
    return deepClone(actor);
  }

  resolveWriteActor(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    assertOrThrow(input && typeof input === "object", "invalid_write_actor", "write actor payload is required");
    assertOrThrow(
      typeof input.agentId === "string" && input.agentId.trim().length > 0,
      "invalid_write_actor",
      "agentId is required"
    );
    const actor = requireWriteActor(topic, input.agentId.trim(), {
      codePrefix: input.codePrefix ?? "actor",
      expectedRole: input.expectedRole,
      allowedRoles: input.allowedRoles
    });
    return deepClone(actor);
  }

  listMessages(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    const route = typeof input.route === "string" && input.route.trim() ? input.route.trim() : null;
    if (!route) {
      return Array.from(topic.messages.values()).map((message) => deepClone(message));
    }
    const ids = topic.routes.get(route) ?? [];
    return ids.map((id) => deepClone(topic.messages.get(id))).filter(Boolean);
  }

  listDispatches(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    const status = typeof input.status === "string" && input.status.trim() ? input.status.trim() : null;
    const dispatches = Array.from(topic.dispatches.values());
    if (!status) {
      return dispatches.map((item) => deepClone(item));
    }
    return dispatches.filter((item) => item.status === status).map((item) => deepClone(item));
  }

  getDispatch(topicId, dispatchId) {
    const topic = this.requireTopic(topicId);
    const dispatch = topic.dispatches.get(dispatchId);
    assertOrThrow(dispatch, "dispatch_not_found", `dispatch ${dispatchId} not found`);
    return deepClone(dispatch);
  }

  listConflicts(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    const status = typeof input.status === "string" && input.status.trim() ? input.status.trim() : null;
    const conflicts = Array.from(topic.conflicts.values());
    if (!status) {
      return conflicts.map((item) => deepClone(item));
    }
    return conflicts.filter((item) => item.status === status).map((item) => deepClone(item));
  }

  getConflict(topicId, conflictId) {
    const topic = this.requireTopic(topicId);
    const conflict = topic.conflicts.get(conflictId);
    assertOrThrow(conflict, "conflict_not_found", `conflict ${conflictId} not found`);
    return deepClone(conflict);
  }

  listApprovalHolds(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    const status = typeof input.status === "string" && input.status.trim() ? input.status.trim() : null;
    const holds = Array.from(topic.approvals.values());
    if (!status) {
      return holds.map((item) => deepClone(item));
    }
    return holds.filter((item) => item.status === status).map((item) => deepClone(item));
  }

  getApprovalHold(topicId, holdId) {
    const topic = this.requireTopic(topicId);
    const hold = topic.approvals.get(holdId);
    assertOrThrow(hold, "hold_not_found", `hold ${holdId} not found`);
    return deepClone(hold);
  }

  listDecisions(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    const holdId = typeof input.holdId === "string" && input.holdId.trim() ? input.holdId.trim() : null;
    if (holdId) {
      const hold = topic.approvals.get(holdId);
      assertOrThrow(hold, "hold_not_found", `hold ${holdId} not found`);
    }
    const source = holdId ? [topic.approvals.get(holdId)] : Array.from(topic.approvals.values());
    return source
      .filter(Boolean)
      .filter((hold) => hold.status === "approved" || hold.status === "rejected")
      .map((hold) => ({
        decisionId: `${hold.holdId}:${hold.decidedAt ?? "pending"}`,
        holdId: hold.holdId,
        status: hold.status,
        decider: hold.decider,
        gate: hold.gate,
        decidedAt: hold.decidedAt
      }));
  }

  getDeliveryState(topicId) {
    const topic = this.requireTopic(topicId);
    return deepClone(topic.truth.deliveryState);
  }

  writeDeliveryState(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    assertOrThrow(input && typeof input === "object", "invalid_delivery_writeback", "delivery writeback payload is required");
    assertOrThrow(
      typeof input.sourceActorId === "string" && input.sourceActorId.trim().length > 0,
      "delivery_actor_required",
      "sourceActorId is required"
    );
    assertOrThrow(
      typeof input.state === "string" && input.state.trim().length > 0,
      "delivery_state_required",
      "state is required"
    );

    const actor = requireActiveActorWithAllowedRoles(topic, input.sourceActorId.trim(), ["lead", "human"], "delivery_actor");
    const current = topic.truth.deliveryState.state;
    const nextState = input.state.trim();
    const allowedTransitions = DELIVERY_STATE_GRAPH[current] ?? [];
    assertOrThrow(
      allowedTransitions.includes(nextState),
      "delivery_state_transition_forbidden",
      `delivery state cannot transition from ${current} to ${nextState}`,
      {
        current,
        next: nextState,
        allowed: allowedTransitions
      }
    );

    topic.truth.deliveryState.state = nextState;
    if (Object.prototype.hasOwnProperty.call(input, "prUrl")) {
      topic.truth.deliveryState.prUrl = input.prUrl ?? null;
    }
    topic.truth.deliveryState.lastUpdatedAt = nowIso();
    upsertMergeLifecycleTruth(topic, {
      stage: nextState
    });
    topic.updatedAt = topic.truth.deliveryState.lastUpdatedAt;
    keepHistory(topic, {
      event: "delivery_state_writeback",
      at: topic.truth.deliveryState.lastUpdatedAt,
      by: actor.agentId,
      from: current,
      to: nextState,
      note: input.note ?? null
    });
    return {
      state: topic.truth.deliveryState.state,
      prUrl: topic.truth.deliveryState.prUrl,
      lastUpdatedAt: topic.truth.deliveryState.lastUpdatedAt
    };
  }

  getPrWriteback(topicId) {
    const topic = this.requireTopic(topicId);
    return deepClone(topic.truth.prWriteback);
  }

  writePrWriteback(topicId, input = {}) {
    const topic = this.requireTopic(topicId);
    assertOrThrow(input && typeof input === "object", "invalid_pr_writeback", "pr writeback payload is required");
    assertOrThrow(
      typeof input.sourceActorId === "string" && input.sourceActorId.trim().length > 0,
      "pr_writeback_actor_required",
      "sourceActorId is required"
    );
    assertOrThrow(
      typeof input.prUrl === "string" && input.prUrl.trim().length > 0,
      "pr_writeback_url_required",
      "prUrl is required"
    );

    const actor = requireActiveActorWithAllowedRoles(topic, input.sourceActorId.trim(), ["lead", "human"], "pr_writeback_actor");
    const current = topic.truth.prWriteback.state;
    const nextState = typeof input.state === "string" && input.state.trim().length > 0 ? input.state.trim() : "pr_ready";
    const allowedTransitions = PR_WRITEBACK_STATE_GRAPH[current] ?? [];
    assertOrThrow(
      allowedTransitions.includes(nextState),
      "pr_writeback_state_transition_forbidden",
      `pr writeback state cannot transition from ${current} to ${nextState}`,
      {
        current,
        next: nextState,
        allowed: allowedTransitions
      }
    );

    topic.truth.prWriteback.state = nextState;
    topic.truth.prWriteback.prUrl = input.prUrl.trim();
    topic.truth.prWriteback.lastUpdatedAt = nowIso();
    upsertMergeLifecycleTruth(topic);
    topic.updatedAt = topic.truth.prWriteback.lastUpdatedAt;
    keepHistory(topic, {
      event: "pr_writeback_state_writeback",
      at: topic.truth.prWriteback.lastUpdatedAt,
      by: actor.agentId,
      from: current,
      to: nextState,
      note: input.note ?? null
    });
    return {
      state: topic.truth.prWriteback.state,
      prUrl: topic.truth.prWriteback.prUrl,
      lastUpdatedAt: topic.truth.prWriteback.lastUpdatedAt
    };
  }

  getResourceStateGraph() {
    return {
      dispatch: {
        states: ["pending_accept", "active"],
        transitions: [
          { from: "pending_accept", to: "active", trigger: "status_report:dispatch_accepted" }
        ]
      },
      conflict: {
        states: ["unresolved", "resolved"],
        transitions: [
          { from: "unresolved", to: "resolved", trigger: "conflict_resolution" }
        ]
      },
      approvalHold: {
        states: ["pending", "approved", "rejected"],
        transitions: [
          { from: "pending", to: "approved", trigger: "decision:approve" },
          { from: "pending", to: "rejected", trigger: "decision:reject" }
        ]
      },
      delivery: {
        states: Object.keys(DELIVERY_STATE_GRAPH),
        transitions: Object.entries(DELIVERY_STATE_GRAPH).flatMap(([from, targets]) =>
          targets.map((to) => ({ from, to, trigger: "delivery_writeback" }))
        )
      },
      prWriteback: {
        states: Object.keys(PR_WRITEBACK_STATE_GRAPH),
        transitions: Object.entries(PR_WRITEBACK_STATE_GRAPH).flatMap(([from, targets]) =>
          targets.map((to) => ({ from, to, trigger: "pr_writeback" }))
        )
      }
    };
  }

  sweepConflictEscalations(topic, now = Date.now()) {
    for (const conflict of topic.conflicts.values()) {
      if (conflict.status !== "unresolved" || conflict.escalatedAt) {
        continue;
      }
      if (now < conflict.escalateAfterMs) {
        continue;
      }
      conflict.escalatedAt = nowIso();
      topic.riskFlags.add("conflict_timeout_escalation");
      topic.blockers.set(`conflict_timeout:${conflict.conflictId}`, {
        blockerId: `conflict_timeout:${conflict.conflictId}`,
        reason: "challenge unresolved beyond timeout",
        conflictId: conflict.conflictId,
        createdAt: conflict.escalatedAt
      });
      keepHistory(topic, {
        event: "conflict_timeout_escalated",
        at: conflict.escalatedAt,
        conflictId: conflict.conflictId
      });
    }
  }

  applyMessageSemantics(topic, message) {
    switch (message.type) {
      case "dispatch":
        return this.handleDispatch(topic, message);
      case "status_report":
        return this.handleStatusReport(topic, message);
      case "handoff_package":
        return this.handleHandoff(topic, message);
      case "challenge":
        return this.handleChallenge(topic, message);
      case "conflict_resolution":
        return this.handleConflictResolution(topic, message);
      case "shared_truth_proposal":
        return this.handleSharedTruthProposal(topic, message);
      case "merge_request":
        return this.handleMergeRequest(topic, message);
      case "blocker_escalation":
        return this.handleBlockerEscalation(topic, message);
      case "feedback_ingest":
        return this.handleFeedbackIngest(topic, message);
      default:
        throw new CoordinatorError("unsupported_message_type", `no handler for ${message.type}`);
    }
  }

  handleDispatch(topic, message) {
    assertOrThrow(message.sourceRole === "lead", "dispatch_requires_lead", "dispatch can only be issued by lead");
    assertOrThrow(
      typeof message.payload?.workerAgentId === "string" && message.payload.workerAgentId.length > 0,
      "dispatch_requires_worker",
      "dispatch payload.workerAgentId is required"
    );
    const workerAgentId = message.payload.workerAgentId.trim();
    requireRegisteredActor(topic, workerAgentId, "worker", "dispatch_worker");

    message.state = MESSAGE_STATE.PENDING_ACCEPT;
    topic.dispatches.set(message.messageId, {
      dispatchId: message.messageId,
      workerAgentId,
      status: "pending_accept",
      createdAt: message.createdAt
    });

    return {
      dispatchId: message.messageId,
      status: "pending_accept"
    };
  }

  handleStatusReport(topic, message) {
    const statusEvent = message.payload?.event;
    assertOrThrow(typeof statusEvent === "string" && statusEvent.length > 0, "status_event_required", "status_report payload.event is required");

    if (statusEvent === "dispatch_accepted") {
      const dispatchId = message.payload?.dispatchId;
      const dispatch = topic.dispatches.get(dispatchId);
      assertOrThrow(dispatch, "dispatch_not_found", `dispatch ${dispatchId} not found`);
      assertOrThrow(dispatch.workerAgentId === message.sourceAgentId, "dispatch_accept_forbidden", "only target worker can accept dispatch");
      dispatch.status = "active";
      dispatch.acceptedAt = message.createdAt;
      message.state = MESSAGE_STATE.ACCEPTED;
      return { dispatchId, status: "active" };
    }

    if (statusEvent === "handoff_ack") {
      const handoffId = message.payload?.handoffId;
      const handoff = topic.handoffs.get(handoffId);
      assertOrThrow(handoff, "handoff_not_found", `handoff ${handoffId} not found`);
      const allowedReceivers = collectHandoffReceivers(topic, handoff);
      assertOrThrow(allowedReceivers.size > 0, "handoff_receiver_undefined", "handoff target receiver is undefined");
      assertOrThrow(
        allowedReceivers.has(message.sourceAgentId),
        "handoff_ack_forbidden",
        "handoff_ack must be sent by the intended receiver"
      );
      const resolvedArtifacts = message.payload?.resolvedArtifacts;
      assertOrThrow(
        isAllArtifactsResolved(handoff, resolvedArtifacts),
        "handoff_artifacts_unresolved",
        "handoff_ack requires all referenced artifacts to be resolved"
      );

      handoff.status = "completed";
      handoff.acknowledgedBy = message.sourceAgentId;
      handoff.acknowledgedAt = message.createdAt;
      handoff.resolvedArtifacts = Array.isArray(resolvedArtifacts) ? [...resolvedArtifacts] : [];
      handoff.artifactsResolved = true;
      const handoffMessage = topic.messages.get(handoffId);
      if (handoffMessage) {
        handoffMessage.state = MESSAGE_STATE.CLOSED;
      }
      message.state = MESSAGE_STATE.ACCEPTED;
      return { handoffId, status: "completed" };
    }

    if (statusEvent === "agent_state") {
      const agent = topic.agents.get(message.sourceAgentId);
      if (agent) {
        agent.status = message.payload?.status ?? agent.status;
        agent.lastSeenAt = message.createdAt;
      }
      message.state = MESSAGE_STATE.ACCEPTED;
      return { agentId: message.sourceAgentId, status: agent?.status ?? "unknown" };
    }

    message.state = MESSAGE_STATE.ACCEPTED;
    return { statusEvent };
  }

  handleHandoff(topic, message) {
    const { toAgentId, toRole } = parseHandoffTarget(message.targetScope);
    message.state = MESSAGE_STATE.HANDOFF_PENDING;
    topic.handoffs.set(message.messageId, {
      handoffId: message.messageId,
      fromAgentId: message.sourceAgentId,
      toScope: message.targetScope,
      toAgentId,
      toRole,
      status: "handoff_pending",
      referencedArtifacts: message.referencedArtifacts,
      artifactsResolved: Array.isArray(message.referencedArtifacts) ? message.referencedArtifacts.length === 0 : true,
      createdAt: message.createdAt
    });
    return {
      handoffId: message.messageId,
      status: "handoff_pending"
    };
  }

  handleChallenge(topic, message) {
    const conflictId = message.payload?.conflictId ?? generateId("conflict");
    const scopes = Array.isArray(message.payload?.scopes) ? message.payload.scopes : [];
    const conflict = {
      conflictId,
      challengeMessageId: message.messageId,
      status: "unresolved",
      scopes,
      createdAt: message.createdAt,
      escalateAfterMs: Date.now() + this.escalationMs,
      escalatedAt: null,
      resolution: null
    };
    topic.conflicts.set(conflictId, conflict);
    topic.blockers.set(`conflict:${conflictId}`, {
      blockerId: `conflict:${conflictId}`,
      reason: "unresolved challenge",
      conflictId,
      createdAt: message.createdAt
    });
    message.state = MESSAGE_STATE.BLOCKED_CONFLICT;
    return {
      conflictId,
      status: "unresolved"
    };
  }

  handleConflictResolution(topic, message) {
    assertOrThrow(
      message.sourceRole === "lead" || message.sourceRole === "human",
      "resolution_requires_lead_or_human",
      "conflict_resolution can only be issued by lead or human"
    );
    const conflictId = message.payload?.conflictId;
    assertOrThrow(typeof conflictId === "string" && conflictId.length > 0, "conflict_required", "payload.conflictId is required");
    const conflict = topic.conflicts.get(conflictId);
    assertOrThrow(conflict, "conflict_not_found", `conflict ${conflictId} not found`);
    assertOrThrow(conflict.status === "unresolved", "conflict_already_closed", `conflict ${conflictId} already closed`);
    assertOrThrow(
      ["accept_side", "split_dispatch", "request_evidence", "escalate_human"].includes(message.payload?.outcome),
      "invalid_resolution_outcome",
      "payload.outcome must be one of accept_side/split_dispatch/request_evidence/escalate_human"
    );

    conflict.status = "resolved";
    conflict.resolution = {
      outcome: message.payload.outcome,
      by: message.sourceAgentId,
      at: message.createdAt,
      messageId: message.messageId,
      notes: message.payload?.notes ?? null
    };
    topic.blockers.delete(`conflict:${conflictId}`);
    topic.blockers.delete(`conflict_timeout:${conflictId}`);
    message.state = MESSAGE_STATE.CLOSED;
    return {
      conflictId,
      status: "resolved",
      outcome: conflict.resolution.outcome
    };
  }

  handleSharedTruthProposal(topic, message) {
    assertOrThrow(
      message.truthRevision !== null && Number.isFinite(message.truthRevision),
      "proposal_requires_revision",
      "shared_truth_proposal requires truthRevision"
    );
    assertOrThrow(message.truthRevision <= topic.revision, "revision_ahead", "proposal revision cannot be ahead of current revision");

    if (message.truthRevision < topic.revision) {
      message.state = MESSAGE_STATE.REJECTED;
      throw new CoordinatorError("stale_revision", "proposal uses stale truth revision", {
        expectedRevision: topic.revision,
        gotRevision: message.truthRevision
      });
    }

    const touchedScope = message.payload?.scope ?? null;
    for (const conflict of topic.conflicts.values()) {
      if (conflict.status === "unresolved" && conflictTouchesScope(conflict, touchedScope)) {
        message.state = MESSAGE_STATE.BLOCKED_CONFLICT;
        throw new CoordinatorError("unresolved_conflict", "proposal is blocked by unresolved conflict", {
          conflictId: conflict.conflictId
        });
      }
    }

    const gates = collectDynamicGates(message);
    if (gates.size > 0) {
      const holds = this.createApprovalHolds(topic, message, gates);
      message.state = MESSAGE_STATE.WAITING_GATE;
      return {
        status: "waiting_human_gate",
        holdIds: holds.map((hold) => hold.holdId)
      };
    }

    this.acceptSharedTruthProposal(topic, message);
    return {
      status: "accepted",
      revision: topic.revision
    };
  }

  handleMergeRequest(topic, message) {
    assertOrThrow(message.sourceRole === "worker", "merge_request_requires_worker", "merge_request must be issued by a worker");
    const handoffId = message.payload?.handoffId;
    assertOrThrow(
      typeof handoffId === "string" && handoffId.length > 0,
      "merge_request_requires_handoff",
      "merge_request payload.handoffId is required"
    );
    const handoff = topic.handoffs.get(handoffId);
    assertOrThrow(handoff, "handoff_not_found", `handoff ${handoffId} not found`);
    assertOrThrow(
      handoff.fromAgentId === message.sourceAgentId,
      "merge_request_handoff_owner_mismatch",
      "merge_request must be bound to handoff from the same worker"
    );
    assertOrThrow(
      handoff.status === "completed",
      "merge_request_requires_completed_handoff",
      "merge_request requires lead-accepted completed handoff package"
    );
    assertOrThrow(
      typeof handoff.acknowledgedBy === "string" && hasLeadRole(topic, handoff.acknowledgedBy),
      "merge_request_requires_lead_acceptance",
      "merge_request requires handoff acknowledgment by lead"
    );
    assertOrThrow(
      handoff.artifactsResolved === true,
      "merge_request_requires_resolved_artifacts",
      "merge_request requires resolved handoff artifacts"
    );

    const unresolvedConflicts = Array.from(topic.conflicts.values()).filter((conflict) => conflict.status === "unresolved");
    if (unresolvedConflicts.length > 0) {
      message.state = MESSAGE_STATE.BLOCKED_CONFLICT;
      return {
        status: "blocked_conflict",
        conflictIds: unresolvedConflicts.map((conflict) => conflict.conflictId)
      };
    }

    const gates = collectDynamicGates(message);
    const holds = this.createApprovalHolds(topic, message, gates);
    message.state = MESSAGE_STATE.MERGE_CANDIDATE;
    topic.truth.deliveryState.state = "awaiting_merge_gate";
    topic.truth.deliveryState.lastUpdatedAt = nowIso();
    upsertMergeLifecycleTruth(topic, {
      stage: "awaiting_merge_gate",
      runId: message.runId ?? null,
      checkpointRef: message.payload?.checkpointRef ?? message.payload?.checkpoint_ref ?? null,
      artifactRefs: normalizeArtifactRefs(
        message.payload?.artifactRefs ?? message.payload?.artifact_refs,
        normalizeArtifactRefs(handoff.referencedArtifacts, message.referencedArtifacts)
      )
    });

    return {
      status: "merge_candidate_waiting_human_gate",
      holdIds: holds.map((hold) => hold.holdId)
    };
  }

  handleBlockerEscalation(topic, message) {
    const blockerId = message.payload?.blockerId ?? generateId("blocker");
    topic.blockers.set(blockerId, {
      blockerId,
      reason: message.payload?.reason ?? "unspecified blocker",
      messageId: message.messageId,
      laneId: message.laneId,
      runId: message.runId,
      createdAt: message.createdAt
    });
    message.state = MESSAGE_STATE.ACCEPTED;
    return {
      blockerId
    };
  }

  handleFeedbackIngest(topic, message) {
    topic.feedback.push({
      feedbackId: message.payload?.feedbackId ?? generateId("feedback"),
      sourceAgentId: message.sourceAgentId,
      laneId: message.laneId,
      runId: message.runId,
      payload: deepClone(message.payload),
      createdAt: message.createdAt
    });
    if (topic.feedback.length > 2000) {
      topic.feedback.shift();
    }
    message.state = MESSAGE_STATE.ACCEPTED;
    return {
      feedbackCount: topic.feedback.length
    };
  }

  acceptSharedTruthProposal(topic, message) {
    const patch = message.payload?.patch;
    assertOrThrow(patch && typeof patch === "object", "proposal_requires_patch", "shared_truth_proposal payload.patch is required");
    topic.truth = deepMerge(topic.truth, patch);
    topic.revision += 1;
    topic.truth.deliveryState.lastUpdatedAt = nowIso();
    message.state = MESSAGE_STATE.ACCEPTED;
    keepHistory(topic, {
      event: "shared_truth_revision_advanced",
      at: nowIso(),
      messageId: message.messageId,
      revision: topic.revision
    });
  }

  createApprovalHolds(topic, message, gates) {
    const holds = [];
    for (const gate of gates.values()) {
      const holdId = generateId("hold");
      const hold = {
        holdId,
        gate,
        status: "pending",
        messageId: message.messageId,
        createdAt: nowIso(),
        decidedAt: null,
        decider: null
      };
      topic.approvals.set(holdId, hold);
      holds.push(hold);
    }
    topic.holdsByMessage.set(message.messageId, holds.map((hold) => hold.holdId));
    return holds;
  }

  allHoldsApproved(topic, messageId) {
    const holdIds = topic.holdsByMessage.get(messageId) ?? [];
    if (holdIds.length === 0) {
      return true;
    }
    return holdIds.every((holdId) => topic.approvals.get(holdId)?.status === "approved");
  }

  releaseMessageAfterApprovals(topic, message) {
    if (message.type === "shared_truth_proposal") {
      this.acceptSharedTruthProposal(topic, message);
      return;
    }
    if (message.type === "merge_request") {
      message.state = MESSAGE_STATE.MERGE_CANDIDATE;
      topic.truth.deliveryState.state = "pr_ready";
      topic.truth.deliveryState.prUrl = message.payload?.prUrl ?? null;
      topic.truth.deliveryState.lastUpdatedAt = nowIso();
      upsertMergeLifecycleTruth(topic, {
        stage: "pr_ready"
      });
      keepHistory(topic, {
        event: "delivery_state_updated",
        at: topic.truth.deliveryState.lastUpdatedAt,
        state: topic.truth.deliveryState.state,
        messageId: message.messageId
      });
      return;
    }
    message.state = MESSAGE_STATE.ACCEPTED;
  }

  recordRoute(topic, message) {
    const key = routeKey(message);
    const existing = topic.routes.get(key) ?? [];
    existing.push(message.messageId);
    topic.routes.set(key, existing);
  }

  requireTopic(topicId) {
    assertOrThrow(typeof topicId === "string" && topicId.length > 0, "invalid_topic_id", "topicId is required");
    const topic = this.topics.get(topicId);
    assertOrThrow(topic, "topic_not_found", `topic ${topicId} not found`);
    return topic;
  }
}
