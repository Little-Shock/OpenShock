import assert from "node:assert/strict";
import test from "node:test";

const {
  StateMutationError,
  recoverCreateIssuePayload,
  recoverStateMutationPayload,
} = (await import(new URL("./state-mutation-recovery.ts", import.meta.url).href)) as typeof import("./state-mutation-recovery");

test("recoverCreateIssuePayload keeps room continuity on recoverable issue-create failures", () => {
  const payload: {
    error: string;
    roomId: string;
    state: {
      workspace: Record<string, never>;
    };
  } = {
    error: "worktree 创建失败",
    roomId: "room-runtime",
    state: {
      workspace: {},
    },
  };
  const error = new StateMutationError("worktree 创建失败", 502, payload);

  assert.equal(recoverCreateIssuePayload(error), payload);
  assert.equal(recoverStateMutationPayload(error), payload);
});

test("recoverCreateIssuePayload ignores mutation failures without a room target", () => {
  const payload: {
    error: string;
  } = {
    error: "validation failed",
  };
  const error = new StateMutationError("validation failed", 400, payload);

  assert.equal(recoverCreateIssuePayload(error), null);
  assert.equal(recoverStateMutationPayload(error), payload);
});

test("recoverStateMutationPayload ignores non mutation errors", () => {
  assert.equal(recoverStateMutationPayload(new Error("boom")), null);
  assert.equal(recoverCreateIssuePayload(new Error("boom")), null);
});
