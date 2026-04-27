import { pickPrimaryHandoff } from "./collaboration-protocol.ts";
import type { AgentHandoff, ApprovalCenterItem, PullRequest, Room, Run, Session } from "./phase-zero-types.ts";

export type RoomNextStepSource = "signal" | "handoff" | "run" | "pull-request" | "unread" | "chat";

export type RoomNextStep = {
  source: RoomNextStepSource;
  href: string;
  title: string;
  summary: string;
  reason: string;
  ctaLabel: string;
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

function surfaceLabelFromHref(href: string) {
  if (href.includes("/runs/") || href.includes("?tab=run")) return "执行详情";
  if (href.includes("/pull-requests/") || href.includes("?tab=pr")) return "交付详情";
  if (href.startsWith("/mailbox")) return "交接箱";
  if (href.startsWith("/inbox")) return "收件箱";
  if (href.startsWith("/rooms/")) return "讨论间";
  if (href.startsWith("/pull-requests")) return "交付详情";
  return "下一步";
}

function signalTitle(item: ApprovalCenterItem) {
  switch (item.kind) {
    case "blocked":
      return "先处理阻塞";
    case "approval":
      return "先拍板";
    case "review":
      return "先看评审";
    default:
      return "先看新信号";
  }
}

function runStatusLabel(status?: string) {
  switch (status) {
    case "paused":
      return "已暂停";
    case "blocked":
      return "阻塞";
    case "review":
      return "评审中";
    case "done":
      return "已完成";
    case "running":
      return "执行中";
    default:
      return "待同步";
  }
}

function pullRequestStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "草稿";
    case "open":
      return "已打开";
    case "in_review":
      return "评审中";
    case "changes_requested":
      return "待修改";
    case "merged":
      return "已合并";
    default:
      return "未创建";
  }
}

export function buildRoomNextStep({
  room,
  run,
  session,
  signals,
  handoffs,
  pullRequest,
}: {
  room: Room;
  run: Run;
  session?: Session;
  signals: ApprovalCenterItem[];
  handoffs: AgentHandoff[];
  pullRequest?: PullRequest;
}): RoomNextStep {
  const primarySignal = signals.find((item) => item.kind !== "status") ?? signals[0];
  if (primarySignal) {
    const href = firstNonEmpty(primarySignal.href, "/inbox");
    return {
      source: "signal",
      href,
      title: signalTitle(primarySignal),
      summary: firstNonEmpty(primarySignal.summary, primarySignal.title, room.topic.summary, room.summary),
      reason: `${signals.length} 条待处理信号，先回到${surfaceLabelFromHref(href)}。`,
      ctaLabel: surfaceLabelFromHref(href),
    };
  }

  const handoff = pickPrimaryHandoff(handoffs);
  if (handoff && handoff.status !== "completed") {
    return {
      source: "handoff",
      href: `/mailbox?handoffId=${handoff.id}&roomId=${handoff.roomId}`,
      title: handoff.status === "blocked" ? "先接住交接" : handoff.status === "requested" ? "先认领交接" : "继续交接",
      summary: firstNonEmpty(handoff.lastAction, handoff.summary, handoff.title, room.topic.summary, room.summary),
      reason: `${handoff.fromAgent} -> ${handoff.toAgent}`,
      ctaLabel: "交接箱",
    };
  }

  const currentRunStatus = session?.status ?? run.status;
  const currentTopicStatus = room.topic.status;
  const effectiveRunStatus =
    currentRunStatus === "blocked" || currentRunStatus === "paused" ? currentRunStatus : currentTopicStatus;
  if (effectiveRunStatus === "blocked" || effectiveRunStatus === "paused") {
    return {
      source: "run",
      href: `/rooms/${room.id}?tab=run`,
      title: "先恢复执行",
      summary: firstNonEmpty(run.controlNote, session?.controlNote, run.nextAction, room.topic.summary, room.summary),
      reason: `当前执行${runStatusLabel(effectiveRunStatus)}。`,
      ctaLabel: "执行详情",
    };
  }

  if (pullRequest && pullRequest.status !== "merged") {
    return {
      source: "pull-request",
      href: `/rooms/${room.id}?tab=pr`,
      title: pullRequest.status === "changes_requested" ? "先处理交付修改" : "先看交付",
      summary: firstNonEmpty(pullRequest.reviewSummary, pullRequest.title, run.nextAction, room.topic.summary, room.summary),
      reason: `PR ${pullRequest.label} · ${pullRequestStatusLabel(pullRequest.status)}`,
      ctaLabel: "交付详情",
    };
  }

  if (room.unread > 0) {
    return {
      source: "unread",
      href: `/rooms/${room.id}`,
      title: "先看新回复",
      summary: `${room.unread} 条未读 · ${firstNonEmpty(room.topic.summary, room.summary, "先把当前讨论读完。")}`,
      reason: "先把这间讨论读完，再继续推进。",
      ctaLabel: "讨论间",
    };
  }

  if (currentRunStatus === "done" && pullRequest?.status === "merged") {
    return {
      source: "pull-request",
      href: `/pull-requests/${pullRequest.id}`,
      title: "查看当前结果",
      summary: firstNonEmpty(pullRequest.reviewSummary, pullRequest.title, run.nextAction, run.summary, room.topic.summary, room.summary),
      reason: "这条讨论已经收口，先看当前结果。",
      ctaLabel: "交付详情",
    };
  }

  return {
    source: "chat",
    href: `/rooms/${room.id}`,
    title: "继续当前讨论",
    summary: firstNonEmpty(run.nextAction, session?.summary, run.summary, room.topic.summary, room.summary, "当前讨论还在同步。"),
    reason: "这间讨论还在推进，先回到当前工作。",
    ctaLabel: "讨论间",
  };
}
