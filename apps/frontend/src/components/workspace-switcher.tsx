"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createWorkspace, getWorkspaces, switchWorkspace } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Workspace } from "@/lib/types";

type WorkspaceSwitcherProps = {
  workspaceId: string;
  workspaceName: string;
};

function WorkspaceRow({
  workspace,
  active,
  onClick,
}: {
  workspace: Workspace;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={active}
      onClick={onClick}
      className={cn(
        "w-full rounded-[10px] border px-2.5 py-2 text-left transition-colors disabled:cursor-default",
        active
          ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
          : "border-[var(--border)] bg-white text-black/72 hover:bg-[var(--surface-muted)]",
      )}
    >
      <div
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.12em]",
          active ? "text-[var(--accent-blue)]" : "text-black/45",
        )}
      >
        {active ? "Current workspace" : "Workspace"}
      </div>
      <div className="mt-1 display-font text-[13px] font-bold">
        {workspace.name}
      </div>
    </button>
  );
}

export function WorkspaceSwitcher({
  workspaceId,
  workspaceName,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { sessionToken } = useCurrentOperator();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: workspaceId, name: workspaceName, repoBindings: [] },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [isSwitchPending, setIsSwitchPending] = useState(false);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !sessionToken.trim()) {
      return;
    }

    let cancelled = false;
    void getWorkspaces({ sessionToken })
      .then((response) => {
        if (!cancelled) {
          setWorkspaces(response.workspaces);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedback(error instanceof Error ? error.message : "Failed to load workspaces.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, sessionToken]);

  function handleSwitch(nextWorkspaceId: string) {
    if (isSwitchPending || nextWorkspaceId === workspaceId) {
      return;
    }

    setIsSwitchPending(true);
    setFeedback(null);
    void switchWorkspace(
      { workspaceId: nextWorkspaceId },
      { sessionToken },
    )
      .then(() => {
        setOpen(false);
        router.push("/");
        router.refresh();
      })
      .catch((error) => {
        setFeedback(error instanceof Error ? error.message : "Failed to switch workspace.");
      })
      .finally(() => {
        setIsSwitchPending(false);
      });
  }

  function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatePending || createName.trim().length === 0) {
      return;
    }

    setIsCreatePending(true);
    setFeedback(null);
    void createWorkspace(
      { name: createName.trim() },
      { sessionToken },
    )
      .then((response) => {
        setCreateName("");
        setCreateOpen(false);
        setOpen(false);
        setWorkspaces((current) => [...current, response.workspace]);
        router.push("/");
        router.refresh();
      })
      .catch((error) => {
        setFeedback(error instanceof Error ? error.message : "Failed to create workspace.");
      })
      .finally(() => {
        setIsCreatePending(false);
      });
  }

  const currentWorkspace: Workspace = {
    id: workspaceId,
    name: workspaceName,
    repoBindings: [],
  };
  const otherWorkspaces = workspaces.filter((workspace) => workspace.id !== workspaceId);

  return (
    <>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-label="Switch workspace"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-left transition hover:bg-[var(--surface-muted)]"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-black/45">
              Workspace
            </div>
            <div className="mt-0.5 truncate text-[13px] font-semibold text-black/80">
              {workspaceName}
            </div>
          </div>
          <span
            className={`ml-3 shrink-0 text-[10px] text-black/45 transition ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </button>
        {open ? (
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-[12px] border border-[var(--border)] bg-white p-1.5 shadow-[0_12px_30px_rgba(31,35,41,0.12)]">
            <WorkspaceRow workspace={currentWorkspace} active />
            {otherWorkspaces.length > 0 ? (
              <>
                <div className="my-1.5 border-t border-[var(--border)]" />
                <div className="space-y-1.5">
                  {otherWorkspaces.map((workspace) => (
                    <WorkspaceRow
                      key={workspace.id}
                      workspace={workspace}
                      active={false}
                      onClick={() => handleSwitch(workspace.id)}
                    />
                  ))}
                </div>
              </>
            ) : null}
            <div className="my-1.5 border-t border-[var(--border)]" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex w-full justify-center rounded-[10px] border-[var(--border)] px-2.5 py-2 text-[12px] font-medium"
              onClick={() => setCreateOpen(true)}
              disabled={isSwitchPending}
            >
              Create new workspace
            </Button>
            {feedback ? (
              <p className="mt-2 px-1 text-[11px] leading-5 text-black/55">{feedback}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          if (!isCreatePending) {
            setCreateOpen(false);
          }
        }}
        title="Create Workspace"
        description="Create a fresh workspace shell with the default all and annoucement rooms."
      >
        <form className="space-y-3" onSubmit={handleCreateWorkspace}>
          <input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder="Workspace name"
            className="form-field"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="submit"
              disabled={isCreatePending || createName.trim().length === 0}
              variant="primary"
              size="sm"
              className="control-pill"
            >
              {isCreatePending ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
          {feedback ? <p className="text-xs text-black/60">{feedback}</p> : null}
        </form>
      </Modal>
    </>
  );
}
