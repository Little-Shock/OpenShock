import assert from "node:assert/strict";
import test from "node:test";

import { buildRoomNextStep } from "./room-next-step.ts";
import type { AgentHandoff, ApprovalCenterItem, PullRequest, Room, Run, Session } from "./phase-zero-types.ts";

function buildRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room-runtime",
    issueKey: "OPS-201",
    title: "Runtime pairing",
    summary: "把 runtime 配对收平。",
    unread: 0,
    boardCount: 0,
    runId: "run-runtime",
    messageIds: [],
    topic: {
      id: "topic-runtime",
      title: "收平 runtime pairing",
      summary: "先把 daemon 和 server 配对收平。",
      owner: "Mina",
      status: "running",
    },
    ...overrides,
  };
}

function buildRun(overrides: Partial<Run> = {}): Run {
  return {
    id: "run-runtime",
    roomId: "room-runtime",
    issueKey: "OPS-201",
    topicId: "topic-runtime",
    branch: "lane/runtime",
    worktree: "runtime-lane",
    worktreePath: "/tmp/runtime-lane",
    owner: "Mina",
    runtime: "shock-main",
    machine: "shock-main",
    provider: "codex",
    status: "running",
    summary: "继续收口 runtime pairing。",
    nextAction: "先确认当前 daemon truth。",
    startedAt: "2026-04-23T00:00:00Z",
    duration: "3m",
    approvalRequired: false,
    sandbox: { profile: "trusted" },
    sandboxDecision: { status: "allowed" },
    stdout: [],
    stderr: [],
    toolCalls: [],
    timeline: [],
    pullRequest: "",
    controlNote: "",
    followThread: false,
    ...overrides,
  };
}

function buildSignal(overrides: Partial<ApprovalCenterItem> = {}): ApprovalCenterItem {
  return {
    id: "inbox-blocked",
    kind: "blocked",
    priority: "high",
    room: "Runtime pairing",
    roomId: "room-runtime",
    runId: "run-runtime",
    title: "需要先确认 daemon 地址",
    summary: "当前配对地址还没对齐。",
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
    id: "handoff-runtime",
    title: "请 QA 接手验证",
    summary: "请继续验证 runtime pairing。",
    status: "requested",
    issueKey: "OPS-201",
    roomId: "room-runtime",
    runId: "run-runtime",
    fromAgentId: "agent-pm",
    fromAgent: "PM",
    toAgentId: "agent-qa",
    toAgent: "QA",
    requestedAt: "2026-04-23T00:00:00Z",
    updatedAt: "2026-04-23T00:00:00Z",
    lastAction: "等待 QA 接手。",
    messages: [],
    ...overrides,
  };
}

function buildPullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    id: "pr-runtime",
    number: 23,
    label: "#23",
    title: "Fix runtime pairing drift",
    status: "in_review",
    issueKey: "OPS-201",
    roomId: "room-runtime",
    runId: "run-runtime",
    branch: "lane/runtime",
    author: "Mina",
    reviewSummary: "等待评审确认配对回写。",
    updatedAt: "2026-04-23T00:00:00Z",
    ...overrides,
  };
}

test("buildRoomNextStep prioritizes approval-center signals before every other follow-up", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun(),
    signals: [buildSignal()],
    handoffs: [buildHandoff()],
  });

  assert.equal(nextStep.source, "signal");
  assert.equal(nextStep.href, "/inbox");
  assert.equal(nextStep.title, "先处理阻塞");
  assert.equal(nextStep.ctaLabel, "收件箱");
});

test("buildRoomNextStep labels room-scoped run deep links as execution detail", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun(),
    signals: [buildSignal({ href: "/rooms/room-runtime/runs/run-runtime" })],
    handoffs: [],
  });

  assert.equal(nextStep.source, "signal");
  assert.equal(nextStep.href, "/rooms/room-runtime/runs/run-runtime");
  assert.equal(nextStep.ctaLabel, "执行详情");
});

test("buildRoomNextStep prioritizes active handoffs before paused runs", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun({ status: "paused", controlNote: "等待恢复。" }),
    signals: [],
    handoffs: [buildHandoff({ status: "blocked", lastAction: "等待 QA 回应。" })],
  });

  assert.equal(nextStep.source, "handoff");
  assert.equal(nextStep.href, "/mailbox?handoffId=handoff-runtime&roomId=room-runtime");
  assert.equal(nextStep.title, "先接住交接");
  assert.match(nextStep.reason, /PM -> QA/);
});

test("buildRoomNextStep sends blocked or paused runs to the run panel when no human follow-up is ahead", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun({ status: "blocked", controlNote: "先重新配对 daemon。" }),
    signals: [],
    handoffs: [],
  });

  assert.equal(nextStep.source, "run");
  assert.equal(nextStep.href, "/rooms/room-runtime?tab=run");
  assert.equal(nextStep.title, "先恢复执行");
  assert.match(nextStep.reason, /阻塞/);
});

test("buildRoomNextStep still routes to the run panel when the room topic is blocked but run status has not caught up", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom({
      topic: { ...buildRoom().topic, status: "blocked", summary: "这条讨论当前卡住了。" },
    }),
    run: buildRun({ status: "running", controlNote: "先确认阻塞原因。" }),
    signals: [],
    handoffs: [],
  });

  assert.equal(nextStep.source, "run");
  assert.equal(nextStep.href, "/rooms/room-runtime?tab=run");
  assert.equal(nextStep.ctaLabel, "执行详情");
  assert.match(nextStep.reason, /阻塞/);
});

test("buildRoomNextStep opens the PR panel when delivery is the next review surface", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun(),
    signals: [],
    handoffs: [],
    pullRequest: buildPullRequest(),
  });

  assert.equal(nextStep.source, "pull-request");
  assert.equal(nextStep.href, "/rooms/room-runtime?tab=pr");
  assert.equal(nextStep.ctaLabel, "交付详情");
  assert.match(nextStep.reason, /PR #23/);
});

test("buildRoomNextStep keeps unread chat ahead of a generic continue path", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom({ unread: 3 }),
    run: buildRun(),
    signals: [],
    handoffs: [],
  });

  assert.equal(nextStep.source, "unread");
  assert.equal(nextStep.href, "/rooms/room-runtime");
  assert.equal(nextStep.title, "先看新回复");
  assert.match(nextStep.summary, /3 条未读/);
});

test("buildRoomNextStep sends completed rooms with merged PRs to delivery detail", () => {
  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun({ status: "done", nextAction: "查看最终交付。" }),
    signals: [],
    handoffs: [],
    pullRequest: buildPullRequest({ status: "merged", reviewSummary: "PR 已合并，可以查看最终交付。" }),
  });

  assert.equal(nextStep.source, "pull-request");
  assert.equal(nextStep.href, "/pull-requests/pr-runtime");
  assert.equal(nextStep.title, "查看当前结果");
  assert.equal(nextStep.ctaLabel, "交付详情");
});

test("buildRoomNextStep falls back to continuing the room when no stronger action exists", () => {
  const session: Session = {
    id: "session-runtime",
    issueKey: "OPS-201",
    roomId: "room-runtime",
    topicId: "topic-runtime",
    activeRunId: "run-runtime",
    status: "running",
    summary: "继续确认配对状态。",
    runtime: "shock-main",
    machine: "shock-main",
    provider: "codex",
    branch: "lane/runtime",
    worktree: "runtime-lane",
    worktreePath: "/tmp/runtime-lane",
    pendingTurn: { resumeEligible: false, preview: "" },
    followThread: false,
    controlNote: "",
    updatedAt: "2026-04-23T00:00:00Z",
    memoryPaths: [],
  };

  const nextStep = buildRoomNextStep({
    room: buildRoom(),
    run: buildRun(),
    session,
    signals: [],
    handoffs: [],
  });

  assert.equal(nextStep.source, "chat");
  assert.equal(nextStep.href, "/rooms/room-runtime");
  assert.equal(nextStep.title, "继续当前讨论");
  assert.equal(nextStep.ctaLabel, "讨论间");
});
