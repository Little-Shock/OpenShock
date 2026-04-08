"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAction } from "@/lib/api";
import type { WorkspaceRepoBinding } from "@/lib/types";
import { Button } from "@/components/ui/button";

type WorkspaceRepoBindingProps = {
  workspaceId: string;
  bindings: WorkspaceRepoBinding[];
};

export function WorkspaceRepoBinding({
  workspaceId,
  bindings,
}: WorkspaceRepoBindingProps) {
  const router = useRouter();
  const defaultBinding = bindings.find((binding) => binding.isDefault);
  const [repoPath, setRepoPath] = useState(defaultBinding?.repoPath ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const response = (await submitAction({
          actorType: "member",
          actorId: "Sarah",
          actionType: "Workspace.bind_repo",
          targetType: "workspace",
          targetId: workspaceId,
          idempotencyKey: `workspace-bind-repo-${workspaceId}-${Date.now()}`,
          payload: {
            repoPath,
            makeDefault: true,
          },
        })) as { resultMessage?: string };

        setFeedback(response.resultMessage ?? "Workspace repo binding updated.");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Failed to update workspace repo binding.",
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-[12px] font-medium text-black/70">Default Repo</div>
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-[12px] leading-5 text-black/65">
          {defaultBinding?.repoPath?.trim()
            ? defaultBinding.repoPath
            : "Not bound yet"}
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          value={repoPath}
          onChange={(event) => setRepoPath(event.target.value)}
          placeholder="/absolute/path/to/local/repo"
          className="w-full rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent-blue)]"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] leading-5 text-black/55">
            Issue、run、merge、delivery 当前都解析到 workspace default repo。
          </p>
          <Button
            type="submit"
            disabled={isPending || repoPath.trim().length === 0}
            variant="primary"
            size="sm"
          >
            {isPending ? "Updating..." : "Set Default Repo"}
          </Button>
        </div>
      </form>

      {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
    </div>
  );
}
