"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAction } from "@/lib/api";
import { Button } from "@/components/ui/button";

type RoomActionComposerProps = {
  roomId: string;
};

export function RoomActionComposer({ roomId }: RoomActionComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await submitAction({
          actorType: "member",
          actorId: "Sarah",
          actionType: "RoomMessage.post",
          targetType: "room",
          targetId: roomId,
          idempotencyKey: `room-message-${Date.now()}`,
          payload: { body, kind: "message" },
        });
        setBody("");
        setFeedback("Message posted to the room channel.");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Failed to post message.",
        );
      }
    });
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="relative">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="发消息，支持 @agent_xxx ..."
          className="min-h-[88px] w-full rounded-[10px] border border-[var(--border)] bg-white px-3 py-2.5 pr-24 text-sm outline-none focus:border-[var(--accent-blue)]"
        />
        <Button
          type="submit"
          disabled={isPending || body.trim().length === 0}
          variant="primary"
          size="sm"
          className="absolute bottom-2.5 right-2.5"
        >
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>
      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </form>
  );
}
