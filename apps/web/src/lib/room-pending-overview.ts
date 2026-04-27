import { pickPrimaryHandoff } from "./collaboration-protocol.ts";
import type { AgentHandoff, ApprovalCenterItem } from "./phase-zero-types.ts";

export type RoomPendingOverviewSource = "signal" | "handoff" | "clear";

export type RoomPendingOverview = {
  source: RoomPendingOverviewSource;
  title: string;
  summary: string;
  signalSummary: string;
  handoffSummary: string;
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}

export function buildRoomPendingOverview({
  signals,
  handoffs,
}: {
  signals: ApprovalCenterItem[];
  handoffs: AgentHandoff[];
}): RoomPendingOverview {
  const primarySignal = signals.find((item) => item.kind !== "status") ?? signals[0];
  const primaryHandoff = pickPrimaryHandoff(handoffs);
  const signalSummary = firstNonEmpty(primarySignal?.summary, primarySignal?.title, "暂无待处理信号");
  const handoffSummary = firstNonEmpty(
    primaryHandoff?.lastAction,
    primaryHandoff?.summary,
    primaryHandoff?.title,
    "当前没有待跟进交接"
  );

  if (primarySignal) {
    return {
      source: "signal",
      title: "先看收件箱",
      summary: "有新信号时先处理收件箱，再回来继续这条讨论。",
      signalSummary,
      handoffSummary,
    };
  }

  if (primaryHandoff) {
    return {
      source: "handoff",
      title: "先接住交接",
      summary: "当前没有新的收件箱信号，直接去处理交接。",
      signalSummary,
      handoffSummary,
    };
  }

  return {
    source: "clear",
    title: "当前已清空",
    summary: "没有新的信号或交接。",
    signalSummary,
    handoffSummary,
  };
}
