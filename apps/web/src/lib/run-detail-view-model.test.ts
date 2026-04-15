import assert from "node:assert/strict";
import test from "node:test";

import type { PhaseZeroState, RunDetail, RunHistoryEntry } from "./phase-zero-types";

const { resolveLiveRunDetail } = (await import(new URL("./run-detail-view-model.ts", import.meta.url).href)) as typeof import("./run-detail-view-model");

const sandbox = {
  profile: "trusted",
  allowedHosts: [],
  allowedCommands: [],
  allowedTools: [],
};

const sandboxDecision = {
  status: "idle",
};

function buildState(): PhaseZeroState {
  return {
    workspace: {} as PhaseZeroState["workspace"],
    auth: {} as PhaseZeroState["auth"],
    channels: [],
    channelMessages: {},
    directMessages: [],
    directMessageMessages: {},
    followedThreads: [],
    savedLaterItems: [],
    quickSearchEntries: [],
    issues: [
      {
        id: "issue-runtime",
        key: "OPS-12",
        title: "runtime issue title",
        summary: "runtime issue summary",
        state: "running",
        priority: "high",
        owner: "Codex Dockmaster",
        roomId: "room-runtime",
        runId: "run_runtime_01",
        pullRequest: "PR-12",
        checklist: [],
      } as PhaseZeroState["issues"][number],
    ],
    rooms: [
      {
        id: "room-runtime",
        issueKey: "OPS-12",
        title: "runtime room title",
        unread: 0,
        summary: "runtime room summary",
        boardCount: 1,
        topic: {
          id: "topic-runtime",
          title: "runtime topic title",
          status: "running",
          owner: "Codex Dockmaster",
          summary: "runtime topic summary",
        },
        runId: "run_runtime_01",
        messageIds: [],
      } as PhaseZeroState["rooms"][number],
    ],
    roomMessages: {},
    runs: [
      {
        id: "run_runtime_01",
        roomId: "room-runtime",
        issueKey: "OPS-12",
        summary: "fallback run summary",
        status: "running",
        runtime: "shock-main",
        provider: "Codex CLI",
        machine: "shock-main",
        branch: "feat/fallback",
        worktree: "wt-fallback",
        worktreePath: "",
        owner: "Codex Dockmaster",
        startedAt: "09:18",
        duration: "42m",
        nextAction: "fallback next action",
        stdout: [],
        stderr: [],
        toolCalls: [],
        timeline: [],
        approvalRequired: false,
        sandbox,
        sandboxDecision,
        topicId: "topic-runtime",
        followThread: true,
        pullRequest: "PR-12",
      } as unknown as PhaseZeroState["runs"][number],
    ],
    agents: [],
    machines: [],
    runtimes: [],
    inbox: [],
    mailbox: [],
    roomAgentWaits: [],
    pullRequests: [],
    sessions: [
      {
        id: "session-runtime",
        activeRunId: "run_runtime_01",
        roomId: "room-runtime",
        issueKey: "OPS-12",
        topicId: "topic-runtime",
        status: "running",
        runtime: "shock-main",
        provider: "Codex CLI",
        machine: "shock-main",
        branch: "feat/fallback",
        worktree: "wt-fallback",
        worktreePath: "",
        summary: "fallback session summary",
        updatedAt: "2026-04-16T00:00:00Z",
        memoryPaths: [],
      } as PhaseZeroState["sessions"][number],
    ],
    runtimeLeases: [],
    runtimeScheduler: {} as PhaseZeroState["runtimeScheduler"],
    guards: [],
    memory: [],
    credentials: [],
  };
}

function buildHistoryEntry(): RunHistoryEntry {
  return {
    run: {
      id: "run_history_01",
      roomId: "room-runtime",
      issueKey: "OPS-12",
      summary: "history entry summary",
      status: "done",
      runtime: "shock-main",
      provider: "Codex CLI",
      machine: "shock-main",
      branch: "feat/history",
      worktree: "wt-history",
      worktreePath: "",
      owner: "Claude Review Runner",
      startedAt: "08:00",
      duration: "12m",
      nextAction: "history next action",
      stdout: [],
      stderr: [],
      toolCalls: [],
      timeline: [],
      approvalRequired: false,
      sandbox,
      sandboxDecision,
      topicId: "topic-runtime",
      pullRequest: "PR-12",
    } as unknown as RunHistoryEntry["run"],
    room: {
      id: "room-runtime",
      issueKey: "OPS-12",
      title: "history room title",
      unread: 0,
      summary: "history room summary",
      boardCount: 1,
      topic: {
        id: "topic-runtime",
        title: "history topic title",
        status: "done",
        owner: "Claude Review Runner",
        summary: "history topic summary",
      },
      runId: "run_history_01",
      messageIds: [],
    } as RunHistoryEntry["room"],
    issue: {
      id: "issue-runtime",
      key: "OPS-12",
      title: "history issue title",
      summary: "history issue summary",
      state: "done",
      priority: "high",
      owner: "Claude Review Runner",
      roomId: "room-runtime",
      runId: "run_history_01",
      pullRequest: "PR-12",
      checklist: [],
    } as RunHistoryEntry["issue"],
    session: {
      id: "session-history",
      activeRunId: "run_history_01",
      roomId: "room-runtime",
      issueKey: "OPS-12",
      topicId: "topic-runtime",
      status: "done",
      runtime: "shock-main",
      provider: "Codex CLI",
      machine: "shock-main",
      branch: "feat/history",
      worktree: "wt-history",
      worktreePath: "",
      summary: "history session summary",
      updatedAt: "2026-04-16T00:00:00Z",
      memoryPaths: [],
    } as RunHistoryEntry["session"],
    isCurrent: false,
  };
}

test("resolveLiveRunDetail prefers server detail envelope over client-side fallback truth", () => {
  const state = buildState();
  const history = buildHistoryEntry();
  const detail = {
    run: {
      ...state.runs[0],
      summary: "detail run summary",
      nextAction: "detail next action",
    },
    room: {
      ...state.rooms[0],
      title: "detail room title",
    },
    issue: {
      ...state.issues[0],
      title: "detail issue title",
    },
    session: {
      ...state.sessions[0],
      summary: "detail session summary",
    },
    recoveryAudit: {
      status: "interrupted",
      source: "session.pending_turn",
      preview: "detail recovery preview",
      resumeEligible: true,
    },
    history: [history],
  } as unknown as RunDetail;

  const model = resolveLiveRunDetail(state, "run_runtime_01", "room-runtime", detail);

  assert.equal(model.detail, detail);
  assert.equal(model.run?.summary, "detail run summary");
  assert.equal(model.session?.summary, "detail session summary");
  assert.equal(model.history[0]?.run.id, "run_history_01");
  assert.equal(model.recoveryAudit?.source, "session.pending_turn");
});

test("resolveLiveRunDetail falls back to phase-zero state when the detail envelope is missing", () => {
  const state = buildState();

  const model = resolveLiveRunDetail(state, "run_runtime_01", "room-runtime", null);

  assert.equal(model.detail, null);
  assert.equal(model.run?.summary, "fallback run summary");
  assert.equal(model.session?.summary, "fallback session summary");
  assert.equal(model.history.length, 1);
  assert.equal(model.history[0]?.run.id, "run_runtime_01");
  assert.equal(model.recoveryAudit, null);
});

test("resolveLiveRunDetail ignores a detail envelope for a different run", () => {
  const state = buildState();
  const detail = {
    run: {
      ...state.runs[0],
      id: "run_other_99",
      summary: "wrong run detail summary",
    },
    room: state.rooms[0],
    issue: state.issues[0],
    session: state.sessions[0],
    recoveryAudit: {
      status: "done",
      source: "session.recovery",
      summary: "wrong run recovery summary",
    },
    history: [],
  } as unknown as RunDetail;

  const model = resolveLiveRunDetail(state, "run_runtime_01", "room-runtime", detail);

  assert.equal(model.detail, null);
  assert.equal(model.run?.id, "run_runtime_01");
  assert.equal(model.run?.summary, "fallback run summary");
  assert.equal(model.recoveryAudit, null);
});
