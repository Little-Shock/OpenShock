import assert from "node:assert/strict";
import test from "node:test";

import type { FirstStartJourney } from "./first-start-journey";
import type { Channel, DirectMessage, InboxItem, Room } from "./phase-zero-types";

const { buildContinueTarget, buildRoomContinueTarget, sortRoomsForContinue } = (await import(
  new URL("./continue-target.ts", import.meta.url).href
)) as typeof import("./continue-target");

function buildJourney(overrides: Partial<FirstStartJourney> = {}): FirstStartJourney {
  return {
    accessReady: true,
    onboardingDone: true,
    onboardingStarted: true,
    nextHref: "/setup",
    nextSurfaceLabel: "设置",
    nextLabel: "继续设置",
    nextSummary: "先把工作区接通。",
    launchHref: "/chat/all",
    launchSurfaceLabel: "聊天",
    steps: [],
    ...overrides,
  };
}

function buildRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room-runtime",
    issueKey: "OPS-101",
    title: "Runtime 讨论间",
    unread: 0,
    summary: "继续处理运行环境问题。",
    boardCount: 2,
    topic: {
      id: "topic-runtime",
      title: "Runtime pairing",
      status: "running",
      owner: "Build Pilot",
      summary: "当前还在推进配对修复。",
    },
    runId: "run-runtime",
    messageIds: [],
    ...overrides,
  };
}

function buildInboxItem(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: "inbox-blocked",
    title: "需要你接手",
    kind: "blocked",
    room: "Runtime 讨论间",
    time: "刚刚",
    summary: "QA 等你确认阻塞原因。",
    action: "处理",
    href: "/mailbox?handoffId=handoff-runtime&roomId=room-runtime",
    ...overrides,
  };
}

function buildDirectMessage(overrides: Partial<DirectMessage> = {}): DirectMessage {
  return {
    id: "dm-memory-clerk",
    name: "Memory Clerk",
    summary: "等你确认下一步。",
    purpose: "记忆协作",
    unread: 0,
    presence: "idle",
    counterpart: "Memory Clerk",
    messageIds: [],
    ...overrides,
  };
}

function buildChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: "roadmap",
    name: "#roadmap",
    summary: "产品和排期讨论。",
    purpose: "先在频道里对齐。",
    unread: 0,
    ...overrides,
  };
}

test("buildContinueTarget prioritizes actionable inbox before room when a handoff is waiting", () => {
  const target = buildContinueTarget({
    inbox: [buildInboxItem()],
    channels: [],
    directMessages: [],
    rooms: [
      buildRoom({
        unread: 6,
        topic: { ...buildRoom().topic, status: "blocked" },
      }),
    ],
    journey: buildJourney(),
  });

  assert.equal(target.source, "inbox");
  assert.equal(target.href, "/mailbox?handoffId=handoff-runtime&roomId=room-runtime");
  assert.equal(target.title, "先处理当前待办");
  assert.equal(target.summary, "QA 等你确认阻塞原因。");
  assert.equal(target.reason, "1 条待处理，先接住最紧急的交接或阻塞。");
  assert.equal(target.ctaLabel, "交接箱");
});

test("buildRoomContinueTarget prioritizes blocked room before unread and active rooms", () => {
  const target = buildRoomContinueTarget([
    buildRoom({ id: "room-active", unread: 0 }),
    buildRoom({
      id: "room-unread",
      unread: 8,
      topic: { ...buildRoom().topic, status: "running" },
    }),
    buildRoom({
      id: "room-blocked",
      unread: 0,
      topic: { ...buildRoom().topic, status: "blocked", summary: "需要先处理阻塞。" },
    }),
  ]);

  assert.equal(target?.source, "room-blocked");
  assert.equal(target?.href, "/rooms/room-blocked?tab=run");
  assert.equal(target?.title, "Runtime 讨论间");
  assert.equal(target?.roomTitle, "Runtime 讨论间");
  assert.equal(target?.summary, "需要先处理阻塞。");
  assert.equal(target?.reason, "阻塞 / 暂停优先");
  assert.equal(target?.ctaLabel, "执行详情");
});

test("buildRoomContinueTarget prioritizes unread room before running room", () => {
  const target = buildRoomContinueTarget([
    buildRoom({ id: "room-running", unread: 0 }),
    buildRoom({
      id: "room-unread",
      unread: 3,
      topic: { ...buildRoom().topic, status: "running", summary: "先读完这几条回复。" },
    }),
  ]);

  assert.equal(target?.source, "room-unread");
  assert.equal(target?.title, "Runtime 讨论间");
  assert.equal(target?.roomTitle, "Runtime 讨论间");
  assert.equal(target?.summary, "先读完这几条回复。");
  assert.equal(target?.reason, "3 条未读");
  assert.doesNotMatch(target?.summary ?? "", /Runtime 讨论间/);
});

test("buildRoomContinueTarget sends review rooms straight to delivery detail", () => {
  const target = buildRoomContinueTarget([
    buildRoom({
      id: "room-review",
      unread: 0,
      topic: { ...buildRoom().topic, status: "review", summary: "先处理评审回流。" },
    }),
  ]);

  assert.equal(target?.source, "room-active");
  assert.equal(target?.href, "/rooms/room-review?tab=pr");
  assert.equal(target?.reason, "当前评审中");
  assert.equal(target?.ctaLabel, "交付详情");
});

test("sortRoomsForContinue orders blocked, unread, active, then recent", () => {
  const sorted = sortRoomsForContinue([
    buildRoom({ id: "room-recent", topic: { ...buildRoom().topic, status: "done" } }),
    buildRoom({ id: "room-active", topic: { ...buildRoom().topic, status: "review" } }),
    buildRoom({ id: "room-unread", unread: 4 }),
    buildRoom({ id: "room-blocked", topic: { ...buildRoom().topic, status: "paused" } }),
  ]);

  assert.deepEqual(
    sorted.map((room) => room.id),
    ["room-blocked", "room-unread", "room-active", "room-recent"]
  );
});

test("buildContinueTarget falls back to journey when no inbox or rooms exist", () => {
  const target = buildContinueTarget({
    inbox: [],
    channels: [],
    directMessages: [],
    rooms: [],
    journey: buildJourney({
      nextHref: "/setup",
      nextSurfaceLabel: "设置",
      nextLabel: "继续设置",
      nextSummary: "先把 GitHub 和运行环境接通。",
    }),
  });

  assert.equal(target.source, "journey");
  assert.equal(target.href, "/setup");
  assert.equal(target.title, "继续设置");
  assert.equal(target.ctaLabel, "设置");
});

test("buildContinueTarget lets unread direct messages become the primary continue target", () => {
  const target = buildContinueTarget({
    inbox: [],
    channels: [],
    directMessages: [buildDirectMessage({ unread: 3, summary: "等你拍板是否现在写回。" })],
    rooms: [buildRoom({ topic: { ...buildRoom().topic, status: "done" } })],
    journey: buildJourney(),
  });

  assert.equal(target.source, "direct-message");
  assert.equal(target.href, "/chat/dm-memory-clerk");
  assert.equal(target.title, "Memory Clerk");
  assert.equal(target.summary, "等你拍板是否现在写回。");
  assert.equal(target.reason, "3 条未读私聊");
  assert.equal(target.ctaLabel, "聊天");
});

test("buildContinueTarget lets unread channels beat a recent room when chat is the real next step", () => {
  const target = buildContinueTarget({
    inbox: [],
    channels: [buildChannel({ unread: 4, summary: "路线有新回复。" })],
    directMessages: [],
    rooms: [buildRoom({ topic: { ...buildRoom().topic, status: "done" } })],
    journey: buildJourney(),
  });

  assert.equal(target.source, "channel");
  assert.equal(target.href, "/chat/roadmap");
  assert.equal(target.title, "#roadmap");
  assert.equal(target.summary, "路线有新回复。");
  assert.equal(target.reason, "4 条未读频道消息");
  assert.equal(target.ctaLabel, "聊天");
});
