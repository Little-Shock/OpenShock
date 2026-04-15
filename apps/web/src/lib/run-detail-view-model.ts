import { buildRunHistoryEntries } from "./phase-zero-helpers.ts";
import type { PhaseZeroState, RunDetail } from "./phase-zero-types.ts";

export type LiveRunDetailModel = {
  detail: RunDetail | null;
  run: RunDetail["run"] | null;
  room: RunDetail["room"] | null;
  issue: RunDetail["issue"] | null;
  session: RunDetail["session"] | null;
  history: RunDetail["history"];
  recoveryAudit: RunDetail["recoveryAudit"] | null;
};

export function resolveLiveRunDetail(
  state: PhaseZeroState,
  runId: string,
  roomId?: string,
  detail?: RunDetail | null
): LiveRunDetailModel {
  if (detail && detail.run.id === runId && (!roomId || detail.run.roomId === roomId)) {
    return {
      detail,
      run: detail.run,
      room: detail.room,
      issue: detail.issue,
      session: detail.session,
      history: detail.history,
      recoveryAudit: detail.recoveryAudit,
    };
  }

  const run = state.runs.find((candidate) => candidate.id === runId && (!roomId || candidate.roomId === roomId)) ?? null;
  const room = state.rooms.find((candidate) => candidate.id === (roomId ?? run?.roomId)) ?? null;
  const session = state.sessions.find((candidate) => candidate.activeRunId === runId) ?? null;
  const issue = state.issues.find((candidate) => candidate.roomId === room?.id || candidate.key === run?.issueKey) ?? null;

  return {
    detail: null,
    run,
    room,
    issue,
    session,
    history: run ? buildRunHistoryEntries(state, run.roomId) : [],
    recoveryAudit: null,
  };
}
