"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type MobileDrawerProps = {
  label: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function MobileDrawer({
  label,
  title,
  children,
  className,
}: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="rounded-[10px] border-[var(--border)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      {open
        ? createPortal(
            <div
              className="dialog-scrim fixed inset-0 z-[130] flex items-start justify-end p-3"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                  "dialog-panel card-enter flex h-[calc(100svh-1.5rem)] w-full max-w-[24rem] flex-col overflow-hidden rounded-[24px]",
                  className,
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white px-4 py-3">
                  <div className="display-font text-[14px] font-black uppercase tracking-[0.08em] text-black/88">
                    {title}
                  </div>
                  <button
                    type="button"
                    aria-label={`Close ${title}`}
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border)] bg-white text-[14px] text-black/55 transition hover:bg-[var(--surface-muted)]"
                  >
                    ×
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface-muted)]">
                  {children}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
