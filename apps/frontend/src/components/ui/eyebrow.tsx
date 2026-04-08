import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        "text-[10px] font-black uppercase tracking-[0.16em] text-black/55",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
