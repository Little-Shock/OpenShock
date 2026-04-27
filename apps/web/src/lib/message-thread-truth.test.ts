import assert from "node:assert/strict";
import test from "node:test";

import { buildThreadReplyMap, selectInitialThreadMessageId } from "./message-thread-truth.ts";
import type { Message } from "./phase-zero-types.ts";

function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-root",
    speaker: "Larkspur",
    role: "human",
    tone: "human",
    message: "继续这条讨论",
    time: "09:20",
    ...overrides,
  };
}

test("buildThreadReplyMap groups live replies by replyToMessageId", () => {
  const root = buildMessage({ id: "msg-root" });
  const replyA = buildMessage({
    id: "reply-a",
    speaker: "Codex Dockmaster",
    role: "agent",
    tone: "agent",
    replyToMessageId: "msg-root",
  });
  const replyB = buildMessage({
    id: "reply-b",
    speaker: "System",
    role: "system",
    tone: "system",
    replyToMessageId: "msg-root",
  });

  const threadMap = buildThreadReplyMap([root, replyA, replyB]);

  assert.deepEqual(threadMap["msg-root"]?.map((message) => message.id), ["reply-a", "reply-b"]);
});

test("buildThreadReplyMap ignores dangling reply targets", () => {
  const root = buildMessage({ id: "msg-root" });
  const danglingReply = buildMessage({
    id: "reply-a",
    speaker: "Codex Dockmaster",
    role: "agent",
    tone: "agent",
    replyToMessageId: "missing-root",
  });

  const threadMap = buildThreadReplyMap([root, danglingReply]);

  assert.equal(threadMap["missing-root"], undefined);
});

test("selectInitialThreadMessageId prefers the requested message when it exists", () => {
  const messages = [
    buildMessage({ id: "msg-root" }),
    buildMessage({ id: "reply-a", replyToMessageId: "msg-root" }),
  ];
  const threadMap = buildThreadReplyMap(messages);

  assert.equal(selectInitialThreadMessageId(messages, threadMap, "reply-a"), "reply-a");
});

test("selectInitialThreadMessageId falls back to the first root with live replies", () => {
  const messages = [
    buildMessage({ id: "msg-root" }),
    buildMessage({ id: "reply-a", replyToMessageId: "msg-root" }),
    buildMessage({ id: "msg-latest" }),
  ];
  const threadMap = buildThreadReplyMap(messages);

  assert.equal(selectInitialThreadMessageId(messages, threadMap), "msg-root");
});
