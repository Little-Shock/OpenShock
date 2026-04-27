import assert from "node:assert/strict";
import test from "node:test";

import { buildRoomRelatedSignals } from "./room-related-signals.ts";
import type { ApprovalCenterItem, InboxItem, Room, Run } from "./phase-zero-types.ts";

function buildRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room-memory",
    issueKey: "OPS-27",
    title: "记忆写回讨论间",
    summary: "确认写回优先级。",
    unread: 0,
    boardCount: 0,
    runId: "run_memory_01",
    messageIds: [],
    topic: {
      id: "topic-memory",
      title: "解决写回策略冲突",
      status: "blocked",
      owner: "Memory Clerk",
      summary: "需要一个正式优先级规则。",
    },
    ...overrides,
  };
}

function buildRun(overrides: Partial<Run> = {}): Run {
  return {
    id: "run_memory_01",
    roomId: "room-memory",
    issueKey: "OPS-27",
    topicId: "topic-memory",
    branch: "feat/memory-writeback",
    worktree: "wt-memory-writeback",
    worktreePath: "/tmp/wt-memory-writeback",
    owner: "Memory Clerk",
    runtime: "shock-main",
    machine: "shock-main",
    provider: "codex",
    status: "blocked",
    summary: "写回策略阻塞。",
    nextAction: "确认写回范围。",
    startedAt: "2026-04-23T00:00:00Z",
    duration: "3m",
    approvalRequired: true,
    sandbox: { profile: "restricted" },
    sandboxDecision: { status: "denied" },
    stdout: [],
    stderr: [],
    toolCalls: [],
    timeline: [],
    pullRequest: "",
    controlNote: "等待优先级规则。",
    followThread: false,
    ...overrides,
  };
}

function buildInboxItem(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: "inbox-blocked-memory",
    title: "Memory Clerk 被记忆优先级阻塞",
    kind: "blocked",
    room: "记忆写回讨论间",
    time: "刚刚",
    summary: "写回前需要先确定优先级规则。",
    action: "执行详情",
    href: "/runs/run_memory_01",
    ...overrides,
  };
}

function buildSignal(overrides: Partial<ApprovalCenterItem> = {}): ApprovalCenterItem {
  return {
    id: "signal-memory",
    kind: "blocked",
    priority: "high",
    room: "记忆写回讨论间",
    roomId: "room-memory",
    runId: "run_memory_01",
    title: "需要先确认写回规则",
    summary: "审批中心已有正式信号。",
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

test("buildRoomRelatedSignals falls back to inbox when approval center has no room signal yet", () => {
  const result = buildRoomRelatedSignals({
    signals: [],
    recent: [],
    inbox: [buildInboxItem()],
    room: buildRoom(),
    run: buildRun(),
  });

  assert.equal(result.relatedSignals.length, 1);
  assert.equal(result.relatedSignals[0]?.id, "inbox-blocked-memory");
  assert.equal(result.relatedSignals[0]?.roomId, "room-memory");
  assert.equal(result.relatedSignals[0]?.runId, "run_memory_01");
  assert.equal(result.relatedSignals[0]?.href, "/runs/run_memory_01");
});

test("buildRoomRelatedSignals prefers approval center truth when available", () => {
  const result = buildRoomRelatedSignals({
    signals: [buildSignal()],
    recent: [],
    inbox: [buildInboxItem()],
    room: buildRoom(),
    run: buildRun(),
  });

  assert.deepEqual(result.relatedSignals.map((item) => item.id), ["signal-memory"]);
  assert.equal(result.relatedSignals[0]?.summary, "审批中心已有正式信号。");
});
