"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type ActionMenuItemTone = "primary" | "secondary" | "tint";

type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: ActionMenuItemTone;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  className?: string;
};

const itemToneClassName: Record<ActionMenuItemTone, string> = {
  primary:
    "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white hover:brightness-[0.98]",
  secondary:
    "border-[var(--border)] bg-white text-black/72 hover:bg-[var(--surface-muted)]",
  tint: "border-[var(--accent-blue)]/12 bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] hover:bg-[#dfe9ff]",
};

export function ActionMenu({ items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    function updatePosition() {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? 148;
      const menuHeight = menuRef.current?.offsetHeight ?? 0;
      const gap = 6;
      const viewportPadding = 8;

      let left = rect.right - menuWidth;
      if (left < viewportPadding) {
        left = viewportPadding;
      }

      let top = rect.bottom + gap;
      if (
        menuHeight > 0 &&
        top + menuHeight > window.innerHeight - viewportPadding
      ) {
        top = rect.top - menuHeight - gap;
      }
      if (top < viewportPadding) {
        top = viewportPadding;
      }

      setMenuStyle({
        top,
        left,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
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
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-[8px] border text-[13px] leading-none transition",
          open
            ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
            : "border-[var(--border)] bg-white text-black/55 hover:bg-[var(--surface-muted)]",
        )}
      >
        ⋯
      </button>
      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                top: menuStyle.top,
                left: menuStyle.left,
              }}
              className="fixed z-[100] w-[216px] rounded-[12px] border border-[var(--border)] bg-white p-1.5 shadow-[0_10px_30px_rgba(31,35,41,0.12)]"
            >
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) {
                        return;
                      }
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={cn(
                      "w-full whitespace-nowrap rounded-[8px] border px-2.5 py-1.5 text-left text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                      itemToneClassName[item.tone ?? "secondary"],
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
