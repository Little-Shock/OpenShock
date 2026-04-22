import assert from "node:assert/strict";
import test from "node:test";

import type {
  AgentHandoff,
  Room,
  Run,
  Session,
  WorkspaceGovernanceSnapshot,
} from "./phase-zero-types";

const { buildCollaborationProtocolSteps, pickPrimaryHandoff } = (await import(
  new URL("./collaboration-protocol.ts", import.meta.url).href
)) as typeof import("./collaboration-protocol");

function buildGovernance(overrides: Partial<WorkspaceGovernanceSnapshot> = {}): WorkspaceGovernanceSnapshot {
  return {
    label: "Website Delivery",
    summary: "按主链推进。",
    teamTopology: [],
    handoffRules: [],
    routingPolicy: {
      status: "ready",
      summary: "按默认主链推进。",
      suggestedHandoff: {
        status: "idle",
        reason: "",
      },
    },
    escalationSla: {
      status: "ready",
      summary: "暂无升级。",
      timeoutMinutes: 30,
      retryBudget: 2,
      activeEscalations: 0,
      breachedEscalations: 0,
    },
    notificationPolicy: {
      status: "ready",
      summary: "只推关键提醒。",
    },
    responseAggregation: {
      status: "idle",
      summary: "等待执行结果。",
    },
    humanOverride: {
      status: "idle",
      summary: "暂无人工接管。",
    },
    walkthrough: [],
    stats: {
      openHandoffs: 0,
      blockedEscalations: 0,
      reviewGates: 0,
      humanOverrideGates: 0,
      slaBreaches: 0,
      aggregationSources: 0,
    },
    ...overrides,
  };
}

function buildRoom(): Room {
  return {
    id: "room-website",
    issueKey: "OPS-200",
    title: "Website delivery",
    unread: 0,
    summary: "ship website",
    boardCount: 0,
    topic: {
      id: "topic-website",
      title: "Homepage launch",
      status: "running",
      owner: "Build Pilot",
      summary: "Finish homepage polish",
    },
    runId: "run-website",
    messageIds: [],
  };
}

function buildRun(overrides: Partial<Run> = {}): Run {
  return {
    id: "run-website",
    issueKey: "OPS-200",
    roomId: "room-website",
    topicId: "topic-website",
    status: "running",
    runtime: "shock-main",
    machine: "mbp",
    provider: "codex",
    branch: "feat/homepage",
    worktree: "wt-homepage",
    owner: "Build Pilot",
    startedAt: "2026-04-22T00:00:00Z",
    duration: "5m",
    summary: "主页还在收口。",
    approvalRequired: false,
    sandbox: { profile: "trusted" },
    sandboxDecision: { status: "allowed", reason: "可以执行。" },
    stdout: [],
    stderr: [],
    toolCalls: [],
    timeline: [],
    nextAction: "继续完成首页收尾。",
    pullRequest: "",
    ...overrides,
  };
}

function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-website",
    issueKey: "OPS-200",
    roomId: "room-website",
    topicId: "topic-website",
    activeRunId: "run-website",
    status: "running",
    runtime: "shock-main",
    machine: "mbp",
    provider: "codex",
    branch: "feat/homepage",
    worktree: "wt-homepage",
    worktreePath: "/tmp/wt-homepage",
    summary: "当前执行继续中。",
    updatedAt: "2026-04-22T00:05:00Z",
    memoryPaths: [],
    ...overrides,
  };
}

function buildHandoff(overrides: Partial<AgentHandoff> = {}): AgentHandoff {
  return {
    id: "handoff-1",
    title: "QA review",
    summary: "请 QA 接手验证。",
    status: "requested",
    issueKey: "OPS-200",
    roomId: "room-website",
    runId: "run-website",
    fromAgentId: "agent-dev",
    fromAgent: "Build Pilot",
    toAgentId: "agent-qa",
    toAgent: "Review Runner",
    requestedAt: "2026-04-22T00:04:00Z",
    updatedAt: "2026-04-22T00:04:00Z",
    lastAction: "等待 QA 接手。",
    messages: [],
    ...overrides,
  };
}

test("pickPrimaryHandoff prioritizes blockers before normal active handoffs", () => {
  const selected = pickPrimaryHandoff([
    buildHandoff({ id: "handoff-completed", status: "completed" }),
    buildHandoff({ id: "handoff-requested", status: "requested" }),
    buildHandoff({ id: "handoff-blocked", status: "blocked" }),
  ]);

  assert.equal(selected?.id, "handoff-blocked");
});

test("buildCollaborationProtocolSteps reflects active handoff and resumable turn", () => {
  const steps = buildCollaborationProtocolSteps({
    room: buildRoom(),
    run: buildRun(),
    session: buildSession({
      pendingTurn: {
        resumeEligible: true,
        preview: "上次停在验证表单提交流程。",
      },
    }),
    handoff: buildHandoff(),
    governance: buildGovernance(),
  });

  assert.deepEqual(
    steps.map((step) => [step.id, step.state]),
    [
      ["claim", "ready"],
      ["execute", "active"],
      ["handoff", "ready"],
      ["resume", "ready"],
      ["closeout", "pending"],
    ]
  );
  assert.equal(steps[0]?.meta, "Build Pilot -> Review Runner");
  assert.match(steps[3]?.summary ?? "", /上次停在验证表单提交流程/);
});

test("buildCollaborationProtocolSteps prefers final closeout truth over intermediate lifecycle", () => {
  const steps = buildCollaborationProtocolSteps({
    room: buildRoom(),
    run: buildRun({ status: "done", summary: "开发已经完成。" }),
    session: buildSession({ status: "done" }),
    handoff: buildHandoff({ status: "completed", lastAction: "QA 已完成检查。" }),
    governance: buildGovernance({
      responseAggregation: {
        status: "done",
        summary: "已汇总结果。",
        finalResponse: "首页可以交付。",
        aggregator: "Codex Dockmaster",
      },
    }),
  });

  assert.deepEqual(
    steps.map((step) => [step.id, step.state]),
    [
      ["claim", "done"],
      ["execute", "done"],
      ["handoff", "done"],
      ["resume", "done"],
      ["closeout", "done"],
    ]
  );
  assert.equal(steps[4]?.meta, "收口人 Codex Dockmaster");
  assert.equal(steps[4]?.summary, "首页可以交付。");
});

test("buildCollaborationProtocolSteps ignores handoff suggestions from other rooms", () => {
  const steps = buildCollaborationProtocolSteps({
    room: buildRoom(),
    run: buildRun(),
    session: buildSession(),
    governance: buildGovernance({
      routingPolicy: {
        status: "ready",
        summary: "有建议。",
        suggestedHandoff: {
          status: "ready",
          reason: "别的房间可以交接。",
          roomId: "room-other",
          fromAgent: "Spec Captain",
          toAgent: "QA Runner",
          draftSummary: "请 QA 接手别的房间。",
        },
      },
    }),
  });

  assert.equal(steps[2]?.state, "pending");
  assert.equal(steps[2]?.summary, "当前没有待处理交接。");
});
