import type { Message } from "./phase-zero-types.ts";

export type ThreadMap = Record<string, Message[]>;

export function buildThreadReplyMap(messages: Message[]): ThreadMap {
  const knownMessageIds = new Set(messages.map((message) => message.id));
  const replies: ThreadMap = {};

  messages.forEach((message) => {
    const replyToMessageId = message.replyToMessageId?.trim();
    if (!replyToMessageId || !knownMessageIds.has(replyToMessageId)) {
      return;
    }
    if (!replies[replyToMessageId]) {
      replies[replyToMessageId] = [];
    }
    replies[replyToMessageId].push(message);
  });

  return replies;
}

export function selectInitialThreadMessageId(
  messages: Message[],
  threadMap: ThreadMap,
  preferredMessageId?: string | null
) {
  if (preferredMessageId && messages.some((message) => message.id === preferredMessageId)) {
    return preferredMessageId;
  }

  const threadedMessage = messages.find((message) => (threadMap[message.id] ?? []).length > 0);
  return threadedMessage?.id ?? messages[messages.length - 1]?.id ?? null;
}
