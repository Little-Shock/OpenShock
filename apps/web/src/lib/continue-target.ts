import type { FirstStartJourney } from "@/lib/first-start-journey";
import type { Channel, DirectMessage, InboxItem, Room, RunStatus } from "@/lib/phase-zero-types";

export type ContinueTargetSource =
  | "inbox"
  | "direct-message"
  | "channel"
  | "room-blocked"
  | "room-unread"
  | "room-active"
  | "room-recent"
  | "journey";

export type ContinueTarget = {
  source: ContinueTargetSource;
  href: string;
  title: string;
  summary: string;
  reason: string;
  ctaLabel: string;
  roomTitle?: string;
  roomId?: string;
  inboxId?: string;
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
  if (href.includes("?tab=run") || href.includes("/runs/")) return "执行详情";
  if (href.includes("?tab=pr")) return "交付详情";
  if (href.startsWith("/mailbox")) return "交接箱";
  if (href.startsWith("/inbox")) return "收件箱";
  if (href.startsWith("/rooms")) return "讨论间";
  if (href.startsWith("/pull-requests")) return "交付详情";
  if (href.startsWith("/setup")) return "设置";
  if (href.startsWith("/access")) return "身份";
  if (href.startsWith("/onboarding")) return "设置";
  if (href.startsWith("/chat")) return "聊天";
  return "下一步";
}

function roomRank(status: RunStatus, unread: number) {
  if (status === "blocked" || status === "paused") return 0;
  if (unread > 0) return 1;
  if (status === "running" || status === "review") return 2;
  return 3;
}

function roomTargetSource(status: RunStatus, unread: number): ContinueTargetSource {
  const rank = roomRank(status, unread);
  if (rank === 0) return "room-blocked";
  if (rank === 1) return "room-unread";
  if (rank === 2) return "room-active";
  return "room-recent";
}

function roomContinueHref(room: Room, source: ContinueTargetSource) {
  if (source === "room-blocked") return `/rooms/${room.id}?tab=run`;
  if (source === "room-active" && room.topic.status === "review") return `/rooms/${room.id}?tab=pr`;
  return `/rooms/${room.id}`;
}

function inboxKindRank(kind: InboxItem["kind"]) {
  if (kind === "blocked") return 0;
  if (kind === "approval") return 1;
  if (kind === "review") return 2;
  return 3;
}

function sortInboxForContinue(items: InboxItem[]) {
  return [...items].sort((left, right) => {
    const leftRank = inboxKindRank(left.kind);
    const rightRank = inboxKindRank(right.kind);
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.title.localeCompare(right.title);
  });
}

function buildInboxContinueTarget(inbox: InboxItem[]): ContinueTarget | null {
  const actionableInbox = sortInboxForContinue(inbox.filter((item) => item.kind !== "status"));
  const firstInbox = actionableInbox[0];
  if (!firstInbox) return null;

  return {
    source: "inbox",
    inboxId: firstInbox.id,
    href: firstInbox.href || "/mailbox",
    title: "先处理当前待办",
    summary: firstInbox.summary || firstInbox.title,
    reason: `${actionableInbox.length} 条待处理，先接住最紧急的交接或阻塞。`,
    ctaLabel: surfaceLabelFromHref(firstInbox.href || "/mailbox"),
  };
}

function buildDirectMessageContinueTarget(directMessages: DirectMessage[]): ContinueTarget | null {
  const target = [...directMessages]
    .filter((message) => message.unread > 0)
    .sort((left, right) => {
      if (left.unread !== right.unread) return right.unread - left.unread;
      return left.name.localeCompare(right.name);
    })[0];

  if (!target) return null;

  return {
    source: "direct-message",
    href: `/chat/${target.id}`,
    title: target.name,
    summary: firstNonEmpty(target.summary, target.purpose, `${target.name} 在等你回复。`),
    reason: `${target.unread} 条未读私聊`,
    ctaLabel: "聊天",
  };
}

function buildChannelContinueTarget(channels: Channel[]): ContinueTarget | null {
  const target = [...channels]
    .filter((channel) => channel.unread > 0)
    .sort((left, right) => {
      if (left.unread !== right.unread) return right.unread - left.unread;
      return left.name.localeCompare(right.name);
    })[0];

  if (!target) return null;

  return {
    source: "channel",
    href: `/chat/${target.id}`,
    title: target.name,
    summary: firstNonEmpty(target.summary, target.purpose, `${target.name} 有新消息。`),
    reason: `${target.unread} 条未读频道消息`,
    ctaLabel: "聊天",
  };
}

export function sortRoomsForContinue(rooms: Room[]) {
  return [...rooms].sort((left, right) => {
    const leftRank = roomRank(left.topic.status, left.unread);
    const rightRank = roomRank(right.topic.status, right.unread);
    if (leftRank !== rightRank) return leftRank - rightRank;
    if (left.unread !== right.unread) return right.unread - left.unread;
    if (left.boardCount !== right.boardCount) return right.boardCount - left.boardCount;
    return left.title.localeCompare(right.title);
  });
}

export function buildRoomContinueTarget(rooms: Room[]): ContinueTarget | null {
  const room = sortRoomsForContinue(rooms)[0];
  if (!room) return null;
  const roomSummary = firstNonEmpty(room.topic.summary, room.summary, room.topic.title, room.title);

  const source = roomTargetSource(room.topic.status, room.unread);
  const href = roomContinueHref(room, source);
  const ctaLabel = surfaceLabelFromHref(href);
  if (source === "room-blocked") {
    return {
      source,
      roomTitle: room.title,
      roomId: room.id,
      href,
      title: room.title,
      summary: roomSummary,
      reason: "阻塞 / 暂停优先",
      ctaLabel,
    };
  }
  if (source === "room-unread") {
    return {
      source,
      roomTitle: room.title,
      roomId: room.id,
      href,
      title: room.title,
      summary: roomSummary,
      reason: `${room.unread} 条未读`,
      ctaLabel,
    };
  }
  if (source === "room-active") {
    return {
      source,
      roomTitle: room.title,
      roomId: room.id,
      href,
      title: room.title,
      summary: roomSummary,
      reason: room.topic.status === "review" ? "当前评审中" : "当前进行中",
      ctaLabel,
    };
  }
  return {
    source,
    roomTitle: room.title,
    roomId: room.id,
    href,
    title: room.title,
    summary: roomSummary,
    reason: "最近讨论",
    ctaLabel,
  };
}

export function buildContinueTarget({
  inbox,
  channels,
  directMessages,
  rooms,
  journey,
}: {
  inbox: InboxItem[];
  channels: Channel[];
  directMessages: DirectMessage[];
  rooms: Room[];
  journey: FirstStartJourney;
}): ContinueTarget {
  const inboxTarget = buildInboxContinueTarget(inbox);
  if (inboxTarget) {
    return inboxTarget;
  }

  const roomTarget = buildRoomContinueTarget(rooms);
  if (roomTarget?.source === "room-blocked") {
    return roomTarget;
  }

  const directMessageTarget = buildDirectMessageContinueTarget(directMessages);
  if (directMessageTarget) {
    return directMessageTarget;
  }

  const channelTarget = buildChannelContinueTarget(channels);
  if (channelTarget) {
    return channelTarget;
  }

  if (roomTarget) {
    return roomTarget;
  }

  return {
    source: "journey",
    href: journey.nextHref,
    title: journey.nextLabel,
    summary: journey.nextSummary,
    reason: "当前没有待办或讨论，先完成工作区下一步。",
    ctaLabel: journey.nextSurfaceLabel,
  };
}
