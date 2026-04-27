import type { DirectMessage, MessageSurfaceEntry } from "@/lib/phase-zero-types";

type SidebarDirectMessageSource = Pick<DirectMessage, "id" | "name" | "summary" | "unread" | "presence">;

export function buildChannelWorkbenchHref(channelId: string, tab: "chat" | "followed" | "saved", threadId?: string) {
  const params = new URLSearchParams();
  if (tab !== "chat") {
    params.set("tab", tab);
  }
  if (threadId) {
    params.set("thread", threadId);
  }
  const query = params.toString();
  return query ? `/chat/${channelId}?${query}` : `/chat/${channelId}`;
}

export function buildSidebarDirectMessages<T extends SidebarDirectMessageSource>(directMessages: T[]) {
  return directMessages.map((item) => ({
    ...item,
    href: buildChannelWorkbenchHref(item.id, "chat"),
  }));
}

function buildSidebarMessageSurfaceEntries(items: MessageSurfaceEntry[], tab: "followed" | "saved") {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    meta: `${item.channelLabel} · ${item.updatedAt}`,
    unread: item.unread,
    href: buildChannelWorkbenchHref(item.channelId, tab, item.messageId),
  }));
}

export function buildSidebarFollowedThreads(items: MessageSurfaceEntry[]) {
  return buildSidebarMessageSurfaceEntries(items, "followed");
}

export function buildSidebarSavedLaterItems(items: MessageSurfaceEntry[]) {
  return buildSidebarMessageSurfaceEntries(items, "saved");
}
