import type { ApprovalCenterItem, InboxDecision, InboxItem, Room, Run } from "./phase-zero-types.ts";

function matchesRelatedSignal(
  item: Pick<ApprovalCenterItem, "room" | "roomId" | "runId" | "href"> | Pick<InboxItem, "room" | "href">,
  room: Room,
  run: Run
) {
  return (
    ("roomId" in item && item.roomId === room.id) ||
    ("runId" in item && item.runId === run.id) ||
    item.room === room.title ||
    item.href.includes(room.id) ||
    item.href.includes(run.id)
  );
}

function inboxPriority(kind: InboxItem["kind"]): ApprovalCenterItem["priority"] {
  if (kind === "approval") return "critical";
  if (kind === "blocked") return "high";
  return "info";
}

function inboxDecisionOptions(kind: InboxItem["kind"]): InboxDecision[] {
  if (kind === "approval") return ["approved", "deferred"];
  if (kind === "review") return ["merged", "changes_requested"];
  return ["resolved"];
}

function inboxToApprovalSignal(item: InboxItem, room: Room, run: Run): ApprovalCenterItem {
  return {
    id: item.id,
    kind: item.kind,
    priority: inboxPriority(item.kind),
    room: item.room,
    roomId: room.id,
    runId: run.id,
    title: item.title,
    summary: item.summary,
    action: item.action,
    href: item.href,
    time: item.time,
    unread: true,
    decisionOptions: inboxDecisionOptions(item.kind),
    deliveryStatus: "ready",
    deliveryTargets: 1,
    blockedDeliveries: 0,
  };
}

export function buildRoomRelatedSignals({
  signals,
  recent,
  inbox,
  room,
  run,
}: {
  signals: ApprovalCenterItem[];
  recent: ApprovalCenterItem[];
  inbox: InboxItem[];
  room: Room;
  run: Run;
}) {
  const relatedSignals = signals.filter((item) => matchesRelatedSignal(item, room, run));
  const recentSignals = recent.filter((item) => matchesRelatedSignal(item, room, run));

  if (relatedSignals.length > 0 || recentSignals.length > 0) {
    return {
      relatedSignals,
      recentSignals,
    };
  }

  const fallbackSignals = inbox
    .filter((item) => item.kind !== "status")
    .filter((item) => matchesRelatedSignal(item, room, run))
    .map((item) => inboxToApprovalSignal(item, room, run));

  return {
    relatedSignals: fallbackSignals,
    recentSignals: fallbackSignals,
  };
}
