import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChannelWorkbenchHref,
  buildSidebarDirectMessages,
  buildSidebarFollowedThreads,
  buildSidebarSavedLaterItems,
} from "./sidebar-desk.ts";

test("sidebar desk keeps direct messages on their chat route", () => {
  const entries = buildSidebarDirectMessages([
    {
      id: "dm-codex",
      name: "@Codex",
      summary: "继续当前私聊",
      purpose: "继续当前私聊",
      unread: 2,
      presence: "running",
      counterpart: "Codex",
      messageIds: [],
    },
  ]);

  assert.deepEqual(entries, [
    {
      id: "dm-codex",
      name: "@Codex",
      summary: "继续当前私聊",
      purpose: "继续当前私聊",
      unread: 2,
      presence: "running",
      counterpart: "Codex",
      messageIds: [],
      href: "/chat/dm-codex",
    },
  ]);
});

test("sidebar desk keeps followed and saved threads reopenable from every work surface", () => {
  assert.equal(buildChannelWorkbenchHref("channel-all", "chat", "msg-1"), "/chat/channel-all?thread=msg-1");
  assert.equal(
    buildChannelWorkbenchHref("channel-all", "followed", "msg-1"),
    "/chat/channel-all?tab=followed&thread=msg-1"
  );
  assert.equal(
    buildChannelWorkbenchHref("channel-all", "saved", "msg-2"),
    "/chat/channel-all?tab=saved&thread=msg-2"
  );

  const followed = buildSidebarFollowedThreads([
    {
      id: "followed-1",
      channelId: "channel-all",
      messageId: "msg-1",
      channelLabel: "#all",
      title: "需要继续跟的线程",
      summary: "回到这条线程继续",
      note: "note",
      updatedAt: "10:30",
      unread: 1,
    },
  ]);
  const saved = buildSidebarSavedLaterItems([
    {
      id: "saved-1",
      channelId: "channel-all",
      messageId: "msg-2",
      channelLabel: "#all",
      title: "晚点再看",
      summary: "先放一边",
      note: "note",
      updatedAt: "11:45",
      unread: 0,
    },
  ]);

  assert.deepEqual(followed, [
    {
      id: "followed-1",
      title: "需要继续跟的线程",
      summary: "回到这条线程继续",
      meta: "#all · 10:30",
      unread: 1,
      href: "/chat/channel-all?tab=followed&thread=msg-1",
    },
  ]);
  assert.deepEqual(saved, [
    {
      id: "saved-1",
      title: "晚点再看",
      summary: "先放一边",
      meta: "#all · 11:45",
      unread: 0,
      href: "/chat/channel-all?tab=saved&thread=msg-2",
    },
  ]);
});
