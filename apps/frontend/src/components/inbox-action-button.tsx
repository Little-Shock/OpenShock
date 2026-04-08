"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAction } from "@/lib/api";
import type { InboxItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

type InboxActionButtonProps = {
  item: InboxItem;
};

function labelFor(item: InboxItem) {
  switch (item.primaryActionType) {
    case "Run.approve":
      return "Approve";
    case "Run.cancel":
      return "Stop";
    case "GitIntegration.merge.approve":
      return "Approve Merge";
    default:
      return "View";
  }
}

export function InboxActionButton({ item }: InboxActionButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const actionable =
    Boolean(item.primaryActionType) &&
    Boolean(item.relatedEntityType) &&
    Boolean(item.relatedEntityId) &&
    (item.primaryActionType === "Run.approve" ||
      item.primaryActionType === "Run.cancel" ||
      item.primaryActionType === "GitIntegration.merge.approve");

  function handleAction() {
    if (!actionable || !item.primaryActionType || !item.relatedEntityType || !item.relatedEntityId) {
      return;
    }

    const actionType = item.primaryActionType;
    const targetType = item.relatedEntityType;
    const targetId = item.relatedEntityId;

    startTransition(async () => {
      try {
        await submitAction({
          actorType: "member",
          actorId: "Sarah",
          actionType,
          targetType,
          targetId,
          idempotencyKey: `${actionType}-${targetId}-${Date.now()}`,
          payload: {},
        });
        setFeedback("Decision applied.");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Failed to apply inbox action.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <Button
        disabled={!actionable || isPending}
        onClick={handleAction}
        variant="primary"
        size="sm"
      >
        {labelFor(item)}
      </Button>
      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </div>
  );
}
