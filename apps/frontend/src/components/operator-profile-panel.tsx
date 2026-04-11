"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { normalizeOperatorName } from "@/lib/operator";

export function OperatorProfilePanel() {
  const router = useRouter();
  const {
    operatorName,
    member,
    isAuthenticated,
    setOperatorName,
    clearAuthSession,
  } = useCurrentOperator();
  const [draftName, setDraftName] = useState(operatorName);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setDraftName(operatorName);
  }, [operatorName]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = normalizeOperatorName(draftName);
    void setOperatorName(nextName)
      .then(() => {
        setDraftName(nextName);
        setFeedback("Display name updated for member-triggered actions.");
        router.refresh();
      })
      .catch((error) => {
        setFeedback(
          error instanceof Error ? error.message : "Failed to update display name.",
        );
      });
  }

  return (
    <Card className="rounded-[18px] px-4 py-4">
      <Eyebrow className="mb-2">Account Profile</Eyebrow>
      <div className="display-font text-xl font-black text-black/88">
        {member?.displayName ?? operatorName}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-black/45">
        @{member?.username ?? "guest"}
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="operator-name"
            className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/45"
          >
            Display name
          </label>
          <input
            id="operator-name"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Enter the display name shown in messages and approvals"
            className="form-field"
            disabled={!isAuthenticated}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="control-pill"
            disabled={!isAuthenticated}
          >
            Save Display Name
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="control-pill"
            onClick={() => {
              void clearAuthSession().then(() => {
                router.push("/login");
                router.refresh();
              });
            }}
            disabled={!isAuthenticated}
          >
            Sign Out
          </Button>
        </div>
      </form>

      {feedback ? <p className="mt-3 text-xs text-black/60">{feedback}</p> : null}
    </Card>
  );
}
