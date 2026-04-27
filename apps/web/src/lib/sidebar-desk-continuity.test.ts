import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const discussionSourcePath = resolve(__dirname, "../components/stitch-chat-room-views.tsx");
const boardInboxSourcePath = resolve(__dirname, "../components/stitch-board-inbox-views.tsx");

function readSource(path: string) {
  return readFileSync(path, "utf8");
}

test("room and board sidebars keep dm and desk objects available outside chat", () => {
  const discussionSource = readSource(discussionSourcePath);
  const boardInboxSource = readSource(boardInboxSourcePath);

  assert.match(discussionSource, /const sidebarDirectMessages = loading \|\| error \? \[\] : buildSidebarDirectMessages\(state\.directMessages\);/);
  assert.match(discussionSource, /const sidebarFollowedThreads = loading \|\| error \? \[\] : buildSidebarFollowedThreads\(state\.followedThreads\);/);
  assert.match(discussionSource, /const sidebarSavedLaterItems = loading \|\| error \? \[\] : buildSidebarSavedLaterItems\(state\.savedLaterItems\);/);
  assert.match(discussionSource, /directMessages=\{sidebarDirectMessages\}/);
  assert.match(discussionSource, /followedThreads=\{sidebarFollowedThreads\}/);
  assert.match(discussionSource, /savedLaterItems=\{sidebarSavedLaterItems\}/);

  assert.match(boardInboxSource, /const sidebarDirectMessages = loading \|\| error \? \[\] : buildSidebarDirectMessages\(state\.directMessages\);/);
  assert.match(boardInboxSource, /const sidebarFollowedThreads = loading \|\| error \? \[\] : buildSidebarFollowedThreads\(state\.followedThreads\);/);
  assert.match(boardInboxSource, /const sidebarSavedLaterItems = loading \|\| error \? \[\] : buildSidebarSavedLaterItems\(state\.savedLaterItems\);/);
  assert.match(boardInboxSource, /directMessages=\{sidebarDirectMessages\}/);
  assert.match(boardInboxSource, /followedThreads=\{sidebarFollowedThreads\}/);
  assert.match(boardInboxSource, /savedLaterItems=\{sidebarSavedLaterItems\}/);
});
