"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAction } from "@/lib/api";
import type { Agent, IssueSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";

type TaskQuickCreateProps = {
  issueId?: string;
  agents: Agent[];
  issueOptions?: IssueSummary[];
  defaultIssueId?: string;
};

export function TaskQuickCreate({
  issueId,
  agents,
  issueOptions = [],
  defaultIssueId,
}: TaskQuickCreateProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeAgentId, setAssigneeAgentId] = useState(agents[0]?.id ?? "");
  const [selectedIssueId, setSelectedIssueId] = useState(
    issueId ?? defaultIssueId ?? issueOptions[0]?.id ?? "",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resolvedIssueId = issueId ?? selectedIssueId;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        await submitAction({
          actorType: "member",
          actorId: "Sarah",
          actionType: "Task.create",
          targetType: "issue",
          targetId: resolvedIssueId,
          idempotencyKey: `task-create-${Date.now()}`,
          payload: {
            title,
            description,
            assigneeAgentId,
          },
        });
        setTitle("");
        setDescription("");
        setFeedback("Task created.");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Failed to create task.",
        );
      }
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {!issueId && issueOptions.length > 0 ? (
        <select
          value={selectedIssueId}
          onChange={(event) => setSelectedIssueId(event.target.value)}
          className="w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
        >
          {issueOptions.map((issue) => (
            <option key={issue.id} value={issue.id}>
              {issue.title} · {issue.id.replace("_", "#")}
            </option>
          ))}
        </select>
      ) : null}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="New task title"
        className="w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Describe the task outcome and constraints."
        className="min-h-24 w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
      />
      <select
        value={assigneeAgentId}
        onChange={(event) => setAssigneeAgentId(event.target.value)}
        className="w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
      >
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name} · {agent.role}
          </option>
        ))}
      </select>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            isPending || title.trim().length === 0 || resolvedIssueId.length === 0
          }
          variant="primary"
          size="sm"
        >
          {isPending ? "Creating..." : "Create Task"}
        </Button>
      </div>
      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </form>
  );
}
