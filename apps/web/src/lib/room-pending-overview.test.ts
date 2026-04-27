import assert from "node:assert/strict";
import test from "node:test";

import { buildRoomPendingOverview } from "./room-pending-overview.ts";
import type { AgentHandoff, ApprovalCenterItem } from "./phase-zero-types.ts";

function buildSignal(overrides: Partial<ApprovalCenterItem> = {}): ApprovalCenterItem {
  return {
    id: "signal-memory",
    kind: "blocked",
    priority: "high",
    room: "记忆写回讨论间",
    roomId: "room-memory",
    runId: "run-memory",
    title: "需要确认写回优先级",
    summary: "写回前先确认用户、房间和工作区的优先级。",
    action: "处理",
    href: "/inbox",
    time: "刚刚",
    unread: true,
    decisionOptions: ["resolved"],
    deliveryStatus: "ready",
    deliveryTargets: 1,
    blockedDeliveries: 0,
    ...overrides,
  };
}

function buildHandoff(overrides: Partial<AgentHandoff> = {}): AgentHandoff {
  return {
    id: "handoff-memory",
    title: "请 QA 接手记忆写回",
    summary: "确认写回策略不会覆盖用户偏好。",
    status: "requested",
    issueKey: "OPS-27",
    roomId: "room-memory",
    runId: "run-memory",
    fromAgentId: "agent-memory",
    fromAgent: "Memory Clerk",
    toAgentId: "agent-qa",
    toAgent: "QA",
    requestedAt: "2026-04-23T00:00:00Z",
    updatedAt: "2026-04-23T00:00:00Z",
    lastAction: "等待 QA 接手。",
    messages: [],
    ...overrides,
  };
}

test("buildRoomPendingOverview reduces pending work to one primary follow-up", () => {
  const overview = buildRoomPendingOverview({
    signals: [buildSignal()],
    handoffs: [buildHandoff()],
  });

  assert.equal(overview.source, "signal");
  assert.equal(overview.title, "先看收件箱");
  assert.match(overview.signalSummary, /写回前先确认/);
  assert.match(overview.handoffSummary, /等待 QA 接手/);
});

test("buildRoomPendingOverview falls through to handoff when no signal exists", () => {
  const overview = buildRoomPendingOverview({
    signals: [],
    handoffs: [buildHandoff({ lastAction: "请 QA 继续验证。" })],
  });

  assert.equal(overview.source, "handoff");
  assert.equal(overview.title, "先接住交接");
  assert.match(overview.handoffSummary, /继续验证/);
});

test("buildRoomPendingOverview stays quiet when pending work is clear", () => {
  const overview = buildRoomPendingOverview({
    signals: [],
    handoffs: [],
  });

  assert.equal(overview.source, "clear");
  assert.equal(overview.title, "当前已清空");
  assert.equal(overview.signalSummary, "暂无待处理信号");
  assert.equal(overview.handoffSummary, "当前没有待跟进交接");
});
