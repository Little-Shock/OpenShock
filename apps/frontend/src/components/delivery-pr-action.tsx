"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOperator } from "@/components/operator-provider";
import { submitAction } from "@/lib/api";
import { Button } from "@/components/ui/button";

type DeliveryPRActionProps = {
  issueId: string;
  integrationStatus: string;
  existingDeliveryPRId?: string | null;
};

export function DeliveryPRAction({
  issueId,
  integrationStatus,
  existingDeliveryPRId,
}: DeliveryPRActionProps) {
  const router = useRouter();
  const { operatorName, sessionToken } = useCurrentOperator();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canCreate =
    integrationStatus === "ready_for_delivery" && !existingDeliveryPRId;

  function handleCreate() {
    if (!canCreate || isPending) {
      return;
    }

    setIsPending(true);
    void submitAction(
      {
        actorType: "member",
        actorId: operatorName,
        actionType: "DeliveryPR.create.request",
        targetType: "issue",
        targetId: issueId,
        idempotencyKey: `delivery-pr-${issueId}-${Date.now()}`,
        payload: {},
      },
      { sessionToken },
    )
      .then((rawResponse) => {
        const response = rawResponse as { resultMessage: string };
        setFeedback(response.resultMessage);
        router.refresh();
      })
      .catch((error) => {
        setFeedback(
          error instanceof Error ? error.message : "Failed to create delivery PR.",
        );
      })
      .finally(() => {
        setIsPending(false);
      });
  }

  return (
    <div className="space-y-3">
      <Button
        disabled={!canCreate || isPending}
        onClick={handleCreate}
        variant="primary"
        size="sm"
        className="control-pill"
      >
        {existingDeliveryPRId ? "Delivery PR Open" : "Create Delivery PR"}
      </Button>
      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </div>
  );
}
