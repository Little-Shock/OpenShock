"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAction } from "@/lib/api";
import { Button } from "@/components/ui/button";

type IssueQuickCreateProps = {
  onCreated?: () => void;
};

export function IssueQuickCreate({ onCreated }: IssueQuickCreateProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("medium");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await submitAction({
          actorType: "member",
          actorId: "Sarah",
          actionType: "Issue.create",
          targetType: "workspace",
          targetId: "ws_01",
          idempotencyKey: `issue-create-${Date.now()}`,
          payload: {
            title,
            summary,
            priority,
          },
        });
        setTitle("");
        setSummary("");
        setPriority("medium");
        setFeedback("Issue, room, and integration branch created.");
        router.refresh();
        onCreated?.();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Failed to create issue.",
        );
      }
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="New issue title"
        className="w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
      />
      <textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Describe the problem to turn into a new room."
        className="min-h-24 w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
      />
      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
        className="w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
      >
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-black/55">
          Creates the issue shell and default chat room in one action.
        </div>
        <Button
          type="submit"
          disabled={isPending || title.trim().length === 0}
          variant="primary"
          size="sm"
        >
          {isPending ? "Creating..." : "Create Issue"}
        </Button>
      </div>
      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </form>
  );
}
