"use client";

import { useEffect, useState } from "react";
import { IssueQuickCreate } from "@/components/issue-quick-create";

export function IssueCreateDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Create issue"
        onClick={() => setOpen(true)}
        className="flex h-6 w-6 items-center justify-center rounded-[8px] border border-[var(--border)] bg-white text-[15px] leading-none text-black/55 transition hover:bg-[var(--surface-muted)]"
      >
        +
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(31,35,41,0.2)] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[520px] rounded-[18px] border border-[var(--border)] bg-white p-4 shadow-[0_20px_60px_rgba(31,35,41,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="display-font text-[15px] font-black uppercase tracking-[0.08em] text-black/85">
                  Create Issue
                </div>
                <p className="mt-1 text-[12px] text-black/55">
                  Create a new room and issue shell.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close create issue dialog"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--border)] bg-white text-[14px] text-black/55 transition hover:bg-[var(--surface-muted)]"
              >
                ×
              </button>
            </div>
            <IssueQuickCreate onCreated={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
