"use client";

import { useEffect, useRef, useState } from "react";

type WorkspaceSwitcherProps = {
  workspaceName: string;
};

export function WorkspaceSwitcher({
  workspaceName,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
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

  return (
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
          <div className="rounded-[8px] border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-2 text-[12px] font-medium text-[var(--accent-blue)]">
            {workspaceName}
          </div>
          <div className="my-1.5 border-t border-[var(--border)]" />
          <button
            type="button"
            className="w-full rounded-[8px] border border-[var(--border)] bg-white px-2.5 py-2 text-left text-[12px] font-medium text-black/72 transition hover:bg-[var(--surface-muted)]"
          >
            Create new workspace
          </button>
        </div>
      ) : null}
    </div>
  );
}
