"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOperator } from "@/components/operator-provider";
import { submitAction } from "@/lib/api";
import { Button } from "@/components/ui/button";

type RoomActionComposerProps = {
  roomId: string;
  placeholder?: string;
};

export function RoomActionComposer({
  roomId,
  placeholder = "发消息，支持 @agent_xxx ...",
}: RoomActionComposerProps) {
  const router = useRouter();
  const { operatorName, sessionToken } = useCurrentOperator();
  const formRef = useRef<HTMLFormElement>(null);
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageBody = body.trim();
    if (messageBody.length === 0) {
      return;
    }

    setBody("");
    setFeedback(null);
    void submitAction(
      {
        actorType: "member",
        actorId: operatorName,
        actionType: "RoomMessage.post",
        targetType: "room",
        targetId: roomId,
        idempotencyKey: `room-message-${Date.now()}`,
        payload: { body: messageBody, kind: "message" },
      },
      { sessionToken },
    )
      .then(() => {
        router.refresh();
      })
      .catch((error) => {
        setBody((current) => current || messageBody);
        setFeedback(
          error instanceof Error ? error.message : "Failed to post message.",
        );
      });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] w-full flex-1 resize-y rounded-[12px] border border-[var(--border)] bg-white px-3.5 py-3 text-[13px] leading-5 text-black/80 outline-none transition placeholder:text-[13px] placeholder:text-black/42 focus:border-[var(--accent-blue)] sm:min-h-[88px]"
      />
      <div className="shrink-0 sm:self-end">
        <Button
          type="submit"
          disabled={body.trim().length === 0}
          variant="primary"
          size="sm"
          className="control-pill w-full sm:w-auto"
        >
          Send
        </Button>
      </div>
      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </form>
  );
}
