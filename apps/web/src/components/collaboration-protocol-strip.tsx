"use client";

import { Panel } from "@/components/phase-zero-views";
import { buildCollaborationProtocolSteps, type CollaborationProtocolStepState } from "@/lib/collaboration-protocol";
import type { AgentHandoff, Room, Run, Session, WorkspaceGovernanceSnapshot } from "@/lib/phase-zero-types";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function CollaborationProtocolStrip({
  room,
  run,
  session,
  handoff,
  governance,
  prefix,
  testIdPrefix,
  eyebrow = "协作主链",
  title,
  description = "认领、执行、交接、继续、收口一屏看清。",
  className,
}: {
  room?: Room | null;
  run?: Run | null;
  session?: Session | null;
  handoff?: AgentHandoff | null;
  governance?: WorkspaceGovernanceSnapshot | null;
  prefix?: string;
  testIdPrefix?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const steps = buildCollaborationProtocolSteps({ room, run, session, handoff, governance });
  const idPrefix = testIdPrefix || prefix || "collaboration";

  return (
    <Panel tone="paper" data-testid={`${idPrefix}-protocol`} className={cn("!p-3.5", className)}>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.48)]">{eyebrow}</p>
        {title ? <h3 className="mt-2 font-display text-[22px] font-bold leading-6">{title}</h3> : null}
        <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{description}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.id}
            data-testid={`${idPrefix}-step-${step.id}`}
            className={cn(
              "rounded-[18px] border-2 border-[var(--shock-ink)] px-4 py-3 shadow-[var(--shock-shadow-sm)]",
              stepCardTone(step.state)
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className={cn("font-display text-[18px] font-bold leading-6", stepTextTone(step.state))}>{step.label}</p>
              <span
                data-testid={`${idPrefix}-step-${step.id}-status`}
                className={cn(
                  "rounded-full border-2 border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                  stepBadgeTone(step.state)
                )}
              >
                {stepStateLabel(step.state)}
              </span>
            </div>
            <p className={cn("mt-2 text-[13px] leading-6", stepSummaryTone(step.state))}>{step.summary}</p>
            <p className={cn("mt-3 font-mono text-[10px] uppercase tracking-[0.16em]", stepMetaTone(step.state))}>{step.meta}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function stepStateLabel(state: CollaborationProtocolStepState) {
  switch (state) {
    case "ready":
      return "可继续";
    case "active":
      return "进行中";
    case "blocked":
      return "阻塞";
    case "done":
      return "已完成";
    default:
      return "待同步";
  }
}

function stepBadgeTone(state: CollaborationProtocolStepState) {
  switch (state) {
    case "ready":
    case "active":
      return "bg-white";
    case "blocked":
      return "bg-white text-[var(--shock-ink)]";
    case "done":
      return "bg-white text-[var(--shock-ink)]";
    default:
      return "bg-[var(--shock-paper)]";
  }
}

function stepCardTone(state: CollaborationProtocolStepState) {
  switch (state) {
    case "ready":
      return "bg-[var(--shock-yellow)]";
    case "active":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)]";
    case "done":
      return "bg-[var(--shock-ink)]";
    default:
      return "bg-white";
  }
}

function stepTextTone(state: CollaborationProtocolStepState) {
  return state === "blocked" || state === "done" ? "text-white" : "text-[var(--shock-ink)]";
}

function stepSummaryTone(state: CollaborationProtocolStepState) {
  return state === "blocked" || state === "done" ? "text-white/85" : "text-[color:rgba(24,20,14,0.76)]";
}

function stepMetaTone(state: CollaborationProtocolStepState) {
  return state === "blocked" || state === "done" ? "text-white/72" : "text-[color:rgba(24,20,14,0.52)]";
}
