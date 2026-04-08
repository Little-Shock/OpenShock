import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "blue"
  | "blue-soft"
  | "green"
  | "orange"
  | "purple"
  | "neutral"
  | "dark";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

const toneClassName: Record<BadgeTone, string> = {
  blue: "bg-[var(--accent-blue)] text-white",
  "blue-soft": "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]",
  green: "bg-[#e8f7ec] text-[#1f8f4d]",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-[#f2edff] text-[var(--accent-purple)]",
  neutral: "bg-[var(--surface-muted)] text-black/65",
  dark: "bg-[#1f2329] text-white",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[10px] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
