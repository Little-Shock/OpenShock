"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { OpenShockShell } from "@/components/open-shock-shell";
import { Panel } from "@/components/phase-zero-views";
import { usePhaseZeroState } from "@/lib/live-phase0";
import type {
  AgentHandoff,
  PullRequestConversationEntry,
  PullRequestDeliveryCommunicationEntry,
  PullRequestDeliveryDelegation,
  PullRequestDeliveryEntry,
  PullRequestDeliveryEvidence,
  PullRequestDeliveryGate,
  PullRequestDeliveryTemplate,
  PullRequestDetail,
} from "@/lib/phase-zero-types";
import { hasSessionPermission, permissionBoundaryCopy, permissionStatus } from "@/lib/session-authz";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pullRequestStatusLabel(status?: string) {
  switch (status) {
    case "draft":
      return "草稿";
    case "open":
      return "已打开";
    case "in_review":
      return "评审中";
    case "changes_requested":
      return "待修改";
    case "merged":
      return "已合并";
    default:
      return "待同步";
  }
}

function mergeableLabel(mergeable?: string) {
  switch (mergeable) {
    case "MERGEABLE":
      return "mergeable";
    case "CONFLICTING":
      return "conflicting";
    case "UNKNOWN":
      return "computing";
    default:
      return "unspecified";
  }
}

function mergeStateLabel(mergeStateStatus?: string) {
  switch (mergeStateStatus) {
    case "CLEAN":
      return "clean";
    case "DIRTY":
      return "conflicting";
    case "BEHIND":
      return "behind base";
    case "BLOCKED":
      return "blocked";
    case "HAS_HOOKS":
      return "hooks pending";
    case "UNSTABLE":
      return "unstable";
    case "UNKNOWN":
      return "computing";
    default:
      return "unspecified";
  }
}

function deliveryStatusLabel(status: PullRequestDeliveryEntry["status"]) {
  switch (status) {
    case "ready":
      return "release ready";
    case "warning":
      return "warning callout";
    default:
      return "blocked";
  }
}

function deliveryStatusTone(status: PullRequestDeliveryEntry["status"]) {
  switch (status) {
    case "ready":
      return "bg-[var(--shock-lime)]";
    case "warning":
      return "bg-[var(--shock-yellow)]";
    default:
      return "bg-[var(--shock-pink)] text-white";
  }
}

function compactTimestamp(value?: string) {
  if (!value) {
    return "刚刚";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.replace("T", " ").replace(/\.\d+Z$/, " UTC").replace("Z", " UTC");
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
}

function deliveryPanelTone(status: PullRequestDeliveryEntry["status"]) {
  switch (status) {
    case "ready":
      return "lime" as const;
    case "warning":
      return "yellow" as const;
    default:
      return "ink" as const;
  }
}

function delegationStatusLabel(status: PullRequestDeliveryDelegation["status"]) {
  switch (status) {
    case "ready":
      return "delegate ready";
    case "blocked":
      return "delegate blocked";
    case "done":
      return "delegation done";
    default:
      return "waiting";
  }
}

function delegationStatusTone(status: PullRequestDeliveryDelegation["status"]) {
  switch (status) {
    case "ready":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "done":
      return "bg-[var(--shock-yellow)]";
    default:
      return "bg-white";
  }
}

function delegationHandoffStatusLabel(status?: PullRequestDeliveryDelegation["handoffStatus"]) {
  switch (status) {
    case "acknowledged":
      return "handoff acknowledged";
    case "blocked":
      return "handoff blocked";
    case "completed":
      return "handoff completed";
    case "requested":
      return "handoff requested";
    default:
      return "";
  }
}

function delegationHandoffStatusTone(status?: PullRequestDeliveryDelegation["handoffStatus"]) {
  switch (status) {
    case "acknowledged":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "completed":
      return "bg-[var(--shock-yellow)]";
    case "requested":
      return "bg-white";
    default:
      return "bg-white";
  }
}

function delegationResponseStatusLabel(status?: PullRequestDeliveryDelegation["responseHandoffStatus"]) {
  switch (status) {
    case "acknowledged":
      return "reply active";
    case "blocked":
      return "reply blocked";
    case "completed":
      return "reply completed";
    case "requested":
      return "reply requested";
    default:
      return "";
  }
}

function delegationResponseStatusTone(status?: PullRequestDeliveryDelegation["responseHandoffStatus"]) {
  switch (status) {
    case "acknowledged":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "completed":
      return "bg-[var(--shock-yellow)]";
    case "requested":
      return "bg-white";
    default:
      return "bg-white";
  }
}

function delegationCommunicationKindLabel(kind: PullRequestDeliveryCommunicationEntry["messageKind"]) {
  switch (kind) {
    case "request":
      return "request";
    case "ack":
      return "acknowledged";
    case "blocked":
      return "blocked";
    case "comment":
      return "formal comment";
    case "completed":
      return "completed";
    case "response-progress":
      return "response sync";
    case "parent-progress":
      return "parent sync";
    default:
      return kind;
  }
}

function delegationCommunicationKindTone(kind: PullRequestDeliveryCommunicationEntry["messageKind"]) {
  switch (kind) {
    case "request":
      return "bg-white";
    case "ack":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "comment":
      return "bg-[var(--shock-yellow)]";
    case "completed":
      return "bg-[var(--shock-purple)] text-white";
    case "response-progress":
      return "bg-[var(--shock-yellow)]";
    case "parent-progress":
      return "bg-[var(--shock-lime)]";
    default:
      return "bg-white";
  }
}

function mailboxKindLabel(kind?: AgentHandoff["kind"]) {
  switch (kind) {
    case "governed":
      return "governed";
    case "delivery-closeout":
      return "delivery closeout";
    case "delivery-reply":
      return "delivery reply";
    default:
      return "manual";
  }
}

function mailboxReplyStatusLabel(status: AgentHandoff["status"]) {
  switch (status) {
    case "acknowledged":
      return "reply active";
    case "blocked":
      return "reply blocked";
    case "completed":
      return "reply completed";
    default:
      return "reply requested";
  }
}

function mailboxReplyStatusTone(status: AgentHandoff["status"]) {
  switch (status) {
    case "acknowledged":
      return "bg-[var(--shock-lime)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "completed":
      return "bg-[var(--shock-yellow)]";
    default:
      return "bg-white";
  }
}

function mailboxParentStatusLabel(status: AgentHandoff["status"]) {
  return `parent ${delegationHandoffStatusLabel(status)}`;
}

function formatMailboxActionLabel(action: "acknowledged" | "blocked" | "comment" | "completed") {
  switch (action) {
    case "acknowledged":
      return "Acknowledge";
    case "blocked":
      return "Block";
    case "comment":
      return "Formal Comment";
    default:
      return "Complete";
  }
}

function conversationKindLabel(kind: PullRequestConversationEntry["kind"]) {
  switch (kind) {
    case "review":
      return "Review";
    case "review_comment":
      return "Review Comment";
    case "review_thread":
      return "Thread";
    default:
      return "Comment";
  }
}

function conversationTone(kind: PullRequestConversationEntry["kind"]) {
  switch (kind) {
    case "review":
      return "bg-[var(--shock-lime)]";
    case "review_thread":
      return "bg-[var(--shock-purple)] text-white";
    case "review_comment":
      return "bg-[var(--shock-yellow)]";
    default:
      return "bg-white";
  }
}

function gateTone(status: PullRequestDeliveryGate["status"]) {
  switch (status) {
    case "ready":
      return "bg-[var(--shock-lime)]";
    case "warning":
      return "bg-[var(--shock-yellow)]";
    default:
      return "bg-[var(--shock-pink)] text-white";
  }
}

function SurfaceStateMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Panel tone="white">
      <p className="font-display text-[24px] font-bold leading-7">{title}</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{message}</p>
    </Panel>
  );
}

function FactTile({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <div data-testid={testID} className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-white px-3 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">{label}</p>
      <p className="mt-1.5 font-display text-[18px] font-semibold">{value}</p>
    </div>
  );
}

function DeliveryGateCard({ gate }: { gate: PullRequestDeliveryGate }) {
  return (
    <article
      data-testid={`delivery-gate-${gate.id}`}
      className="rounded-[18px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4 shadow-[var(--shock-shadow-sm)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border border-[var(--shock-ink)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]",
            gateTone(gate.status)
          )}
        >
          {deliveryStatusLabel(gate.status)}
        </span>
        <p className="font-display text-[20px] font-bold">{gate.label}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.74)]">{gate.summary}</p>
      {gate.href ? (
        <Link
          href={gate.href}
          className="mt-4 inline-flex border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          Open Gate Context
        </Link>
      ) : null}
    </article>
  );
}

function DeliveryTemplateCard({ template }: { template: PullRequestDeliveryTemplate }) {
  const templateSuffix = (template.templateId || template.label || "untyped")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untyped";
  return (
    <article
      data-testid={`delivery-template-${templateSuffix}`}
      className="rounded-[16px] border-2 border-[var(--shock-ink)] bg-white px-3 py-3 shadow-[var(--shock-shadow-sm)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border border-[var(--shock-ink)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]",
            gateTone(template.status)
          )}
        >
          {deliveryStatusLabel(template.status)}
        </span>
        <p className="font-display text-[18px] font-bold">{template.label}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <FactTile label="Ready" value={String(template.readyDeliveries)} />
        <FactTile label="Blocked" value={String(template.blockedDeliveries)} />
        <FactTile label="Sent" value={String(template.sentReceipts)} />
        <FactTile label="Failed" value={String(template.failedReceipts)} />
      </div>
      {template.href ? (
        <Link
          href={template.href}
          className="mt-4 inline-flex border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          Open Delivery Surface
        </Link>
      ) : null}
    </article>
  );
}

function DeliveryEvidenceCard({ item }: { item: PullRequestDeliveryEvidence }) {
  return (
    <article
      data-testid={`delivery-evidence-${item.id}`}
      className="rounded-[16px] border-2 border-[var(--shock-ink)] bg-white px-3 py-3 shadow-[var(--shock-shadow-sm)]"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.56)]">{item.label}</p>
      <p className="mt-2 break-all font-display text-[18px] font-bold leading-6">{item.value}</p>
      <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{item.summary}</p>
      {item.href ? (
        <Link
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : undefined}
          rel={item.href.startsWith("http") ? "noreferrer" : undefined}
          className="mt-4 inline-flex border border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          Open Evidence
        </Link>
      ) : null}
    </article>
  );
}

function DeliveryCommunicationCard({ entry }: { entry: PullRequestDeliveryCommunicationEntry }) {
  return (
    <article
      data-testid={`delivery-communication-entry-${entry.id}`}
      className="rounded-[16px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4 shadow-[var(--shock-shadow-sm)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
          {entry.handoffLabel}
        </span>
        <span
          className={cn(
            "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
            delegationCommunicationKindTone(entry.messageKind)
          )}
        >
          {delegationCommunicationKindLabel(entry.messageKind)}
        </span>
        <span
          className={cn(
            "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
            delegationHandoffStatusTone(entry.handoffStatus)
          )}
        >
          {delegationHandoffStatusLabel(entry.handoffStatus)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[color:rgba(24,20,14,0.56)]">
        <span>{entry.actor}</span>
        <span>{compactTimestamp(entry.createdAt)}</span>
      </div>
      <p className="mt-3 font-display text-[18px] font-bold leading-6">{entry.handoffTitle}</p>
      <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.74)]">{entry.summary}</p>
      {entry.href ? (
        <Link
          href={entry.href}
          className="mt-4 inline-flex border border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-2 py-1 font-mono text-[10px]"
        >
          Open Mailbox Handoff
        </Link>
      ) : null}
    </article>
  );
}

function ThreadActionCard({
  handoff,
  parentHandoff,
  canMutate,
  busyKey,
  noteValue,
  commentActorId,
  actionError,
  onNoteChange,
  onCommentActorChange,
  onAdvance,
}: {
  handoff: AgentHandoff;
  parentHandoff: AgentHandoff | null;
  canMutate: boolean;
  busyKey: string;
  noteValue: string;
  commentActorId: string;
  actionError?: string | null;
  onNoteChange: (value: string) => void;
  onCommentActorChange: (value: string) => void;
  onAdvance: (
    handoff: AgentHandoff,
    action: "acknowledged" | "blocked" | "comment" | "completed",
    options?: { continueGovernedRoute?: boolean }
  ) => void;
}) {
  const canAck = handoff.status === "requested" || handoff.status === "blocked";
  const canBlock = handoff.status === "requested" || handoff.status === "acknowledged";
  const canComplete = handoff.status === "acknowledged";
  const canResumeParent =
    handoff.kind === "delivery-reply" && parentHandoff && handoff.status === "completed" && parentHandoff.status === "blocked";

  return (
    <article
      data-testid={`thread-action-card-${handoff.id}`}
      className="rounded-[18px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4 shadow-[var(--shock-shadow-sm)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
              {mailboxKindLabel(handoff.kind)}
            </span>
            <span
              data-testid={`thread-action-status-${handoff.id}`}
              className={cn(
                "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                handoff.kind === "delivery-reply" ? mailboxReplyStatusTone(handoff.status) : delegationHandoffStatusTone(handoff.status)
              )}
            >
              {handoff.kind === "delivery-reply" ? mailboxReplyStatusLabel(handoff.status) : delegationHandoffStatusLabel(handoff.status)}
            </span>
            {parentHandoff ? (
              <span
                data-testid={`thread-action-parent-status-${handoff.id}`}
                className={cn(
                  "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                  delegationHandoffStatusTone(parentHandoff.status)
                )}
              >
                {mailboxParentStatusLabel(parentHandoff.status)}
              </span>
            ) : null}
          </div>
          <p className="mt-3 font-display text-[20px] font-bold leading-6">{handoff.title}</p>
          <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.74)]">{handoff.lastAction}</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
          {compactTimestamp(handoff.updatedAt)}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-3">
          <textarea
            data-testid={`thread-action-note-${handoff.id}`}
            value={noteValue}
            onChange={(event) => onNoteChange(event.target.value)}
            disabled={!canMutate}
            className="min-h-[108px] w-full border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-3 text-sm"
            placeholder="comment / blocked 时请写清楚上下文；complete 时可补收口说明。"
          />
          <label className="block space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
              Comment As
            </span>
            <select
              data-testid={`thread-action-comment-actor-${handoff.id}`}
              value={commentActorId}
              disabled={!canMutate}
              onChange={(event) => onCommentActorChange(event.target.value)}
              className="w-full border-2 border-[var(--shock-ink)] bg-white px-3 py-3 text-sm"
            >
              <option value={handoff.fromAgentId}>{handoff.fromAgent}</option>
              <option value={handoff.toAgentId}>{handoff.toAgent}</option>
            </select>
          </label>
          {actionError ? <p className="text-sm leading-6 text-[var(--shock-pink)]">{actionError}</p> : null}
        </div>

        <div className="grid gap-2">
          {([
            ["acknowledged", canAck],
            ["blocked", canBlock],
            ["comment", true],
            ["completed", canComplete],
          ] as const).map(([action, enabled]) => (
            <button
              key={action}
              type="button"
              data-testid={`thread-action-${action}-${handoff.id}`}
              disabled={
                !canMutate ||
                !enabled ||
                busyKey === `${handoff.id}:${action}` ||
                ((action === "comment" || action === "blocked") && !noteValue.trim())
              }
              onClick={() => onAdvance(handoff, action)}
              className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
            >
              {busyKey === `${handoff.id}:${action}` ? "Working..." : formatMailboxActionLabel(action)}
            </button>
          ))}
          {canResumeParent && parentHandoff ? (
            <button
              type="button"
              data-testid={`thread-action-resume-parent-${handoff.id}`}
              disabled={!canMutate || busyKey === `${parentHandoff.id}:acknowledged`}
              onClick={() => onAdvance(parentHandoff, "acknowledged")}
              className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
            >
              {busyKey === `${parentHandoff.id}:acknowledged` ? "Working..." : "Resume Parent Closeout"}
            </button>
          ) : null}
          <Link
            href={`/mailbox?handoffId=${handoff.id}&roomId=${handoff.roomId}`}
            className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.16em]"
          >
            Open In Mailbox
          </Link>
        </div>
      </div>
    </article>
  );
}

function DeliveryThreadActionSurface({ detail }: { detail: PullRequestDetail }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const { state, loading, error, updateHandoff } = usePhaseZeroState();
  const [busyKey, setBusyKey] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [commentActors, setCommentActors] = useState<Record<string, string>>({});

  const authSession = state.auth.session;
  const canMutate = hasSessionPermission(authSession, "run.execute");
  const mutationStatus = loading ? "syncing" : error ? "sync_failed" : permissionStatus(authSession, "run.execute");
  const mutationBoundary = permissionBoundaryCopy(authSession, "run.execute");

  const parentHandoff = detail.delivery.delegation.handoffId
    ? state.mailbox.find((item) => item.id === detail.delivery.delegation.handoffId) ?? null
    : null;
  const responseHandoff = detail.delivery.delegation.responseHandoffId
    ? state.mailbox.find((item) => item.id === detail.delivery.delegation.responseHandoffId) ?? null
    : null;
  const actionHandoffs = [parentHandoff, responseHandoff].filter(Boolean) as AgentHandoff[];

  async function handleAdvance(
    handoff: AgentHandoff,
    action: "acknowledged" | "blocked" | "comment" | "completed",
    options?: { continueGovernedRoute?: boolean }
  ) {
    if (!canMutate) {
      return;
    }
    const note = notes[handoff.id]?.trim() ?? "";
    const commentActorId =
      commentActors[handoff.id] === handoff.toAgentId ? handoff.toAgentId : handoff.fromAgentId;
    const actingAgentId = action === "comment" ? commentActorId : handoff.toAgentId;
    const nextBusyKey = `${handoff.id}:${action}`;

    setBusyKey(nextBusyKey);
    setActionError(null);
    try {
      await updateHandoff(handoff.id, {
        action,
        actingAgentId,
        note: note || undefined,
        continueGovernedRoute: options?.continueGovernedRoute,
      });
      setNotes((current) => ({ ...current, [handoff.id]: "" }));
      startRefresh(() => {
        router.refresh();
      });
    } catch (mutationError) {
      setActionError({
        id: handoff.id,
        message: mutationError instanceof Error ? mutationError.message : "thread action failed",
      });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <Panel tone="paper">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
            Thread Actions
          </p>
          <p className="mt-2 font-display text-[22px] font-bold">Operate Current Closeout Without Leaving PR</p>
          <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            当前活动的 delegated closeout / unblock reply 可以直接在 PR detail 里 formal ack、block、comment、complete，不必先跳去 Mailbox。
          </p>
        </div>
        <div className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-white px-3 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">Mutation Gate</p>
          <p data-testid="pull-request-thread-action-gate" className="mt-1.5 font-display text-[18px] font-semibold">
            {isRefreshing ? "refreshing" : mutationStatus}
          </p>
        </div>
      </div>
      {!canMutate ? (
        <p className="mt-4 text-sm leading-6 text-[var(--shock-pink)]">{mutationBoundary}</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {actionHandoffs.length > 0 ? (
          actionHandoffs.map((handoff) => {
            const noteValue = notes[handoff.id] ?? "";
            const commentActorId =
              commentActors[handoff.id] === handoff.toAgentId ? handoff.toAgentId : handoff.fromAgentId;
            const actionParent = handoff.parentHandoffId
              ? state.mailbox.find((item) => item.id === handoff.parentHandoffId) ?? null
              : null;
            return (
              <ThreadActionCard
                key={handoff.id}
                handoff={handoff}
                parentHandoff={actionParent}
                canMutate={canMutate}
                busyKey={busyKey}
                noteValue={noteValue}
                commentActorId={commentActorId}
                actionError={actionError?.id === handoff.id ? actionError.message : null}
                onNoteChange={(value) => setNotes((current) => ({ ...current, [handoff.id]: value }))}
                onCommentActorChange={(value) => setCommentActors((current) => ({ ...current, [handoff.id]: value }))}
                onAdvance={handleAdvance}
              />
            );
          })
        ) : detail.delivery.delegation.handoffId || detail.delivery.delegation.responseHandoffId ? (
          <p className="text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            当前 live mailbox truth 还在同步，稍后会在这里出现可操作 handoff。
          </p>
        ) : (
          <p className="text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            当前还没有 formal delivery handoff；一旦 delegated closeout / unblock reply 起单，这里会直接变成 thread action surface。
          </p>
        )}
      </div>
    </Panel>
  );
}

export function PullRequestDetailView({
  detail,
  error,
}: {
  detail: PullRequestDetail | null;
  error?: string | null;
}) {
  const contextTitle = detail
    ? `${detail.pullRequest.label} · ${deliveryStatusLabel(detail.delivery.status)}`
    : "Delivery Entry";
  const contextDescription = detail
    ? detail.delivery.summary
    : "Review conversation、release gate、operator handoff note 和 evidence bundle 会在这里收成单一入口。";

  return (
    <OpenShockShell
      view="runs"
      eyebrow="Delivery Entry"
      title="Pull Request Delivery"
      description="这页把 PR detail 升成 delivery entry：同一屏收 review conversation、release gate、operator handoff note 和 customer-facing evidence bundle。"
      contextTitle={contextTitle}
      contextDescription={contextDescription}
      contextBody={
        detail ? (
          <div className="grid gap-2 md:grid-cols-4">
            <FactTile label="Room" value={detail.room.title} testID="pull-request-context-room" />
            <FactTile label="Run" value={detail.run.id} testID="pull-request-context-run" />
            <FactTile label="Issue" value={detail.issue.key} testID="pull-request-context-issue" />
            <FactTile label="Release Ready" value={detail.delivery.releaseReady ? "yes" : "not yet"} testID="pull-request-context-release-ready" />
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error ? (
          <SurfaceStateMessage title="PR delivery entry 同步失败" message={error} />
        ) : !detail ? (
          <SurfaceStateMessage
            title="当前没有 delivery entry"
            message="这条 PR 可能已经不存在，或当前 detail payload 还没有准备好。"
          />
        ) : (
          <>
            <Panel tone="white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.56)]">
                    {detail.pullRequest.label} / {pullRequestStatusLabel(detail.pullRequest.status)}
                  </p>
                  <h2 className="mt-2 font-display text-[30px] font-bold leading-8">{detail.pullRequest.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                    {detail.pullRequest.reviewSummary}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <FactTile label="Branch" value={detail.pullRequest.branch} />
                  <FactTile label="Base" value={detail.pullRequest.baseBranch ?? "待同步"} />
                  <FactTile label="Reviewer Truth" value={detail.pullRequest.reviewDecision || "REVIEW_REQUIRED"} />
                  <FactTile label="Mergeable" value={mergeableLabel(detail.pullRequest.mergeable)} />
                  <FactTile label="Merge Gate" value={mergeStateLabel(detail.pullRequest.mergeStateStatus)} />
                  <FactTile label="Updated" value={detail.pullRequest.updatedAt} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/rooms/${detail.room.id}?tab=pr`}
                  data-testid="pull-request-room-pr-link"
                  className="border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                >
                  Room PR Tab
                </Link>
                <Link
                  href={`/rooms/${detail.room.id}?tab=run`}
                  data-testid="pull-request-room-run-link"
                  className="border-2 border-[var(--shock-ink)] bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                >
                  Run Context
                </Link>
                <Link
                  href="/inbox"
                  data-testid="pull-request-inbox-link"
                  className="border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                >
                  Inbox Back-link
                </Link>
                {detail.pullRequest.url ? (
                  <Link
                    href={detail.pullRequest.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border-2 border-[var(--shock-ink)] bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
                  >
                    Remote PR
                  </Link>
                ) : null}
              </div>
            </Panel>

            <Panel tone={deliveryPanelTone(detail.delivery.status)} className="shadow-[6px_6px_0_0_var(--shock-yellow)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-75">Delivery Status</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span
                      data-testid="pull-request-delivery-status"
                      className={cn(
                        "rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]",
                        deliveryStatusTone(detail.delivery.status)
                      )}
                    >
                      {deliveryStatusLabel(detail.delivery.status)}
                    </span>
                    <h3 className="font-display text-3xl font-bold">Single Delivery Contract</h3>
                  </div>
                  <p className="mt-4 max-w-4xl text-sm leading-6 opacity-85">{detail.delivery.summary}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <FactTile label="Gates" value={String(detail.delivery.gates.length)} testID="pull-request-delivery-gates-count" />
                  <FactTile label="Templates" value={String(detail.delivery.templates.length)} testID="pull-request-delivery-templates-count" />
                  <FactTile label="Evidence" value={String(detail.delivery.evidence.length)} testID="pull-request-delivery-evidence-count" />
                </div>
              </div>
            </Panel>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <Panel tone="paper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                        Release Gate
                      </p>
                      <p className="mt-2 font-display text-[22px] font-bold">Can We Ship This PR?</p>
                    </div>
                    <span className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                      {detail.delivery.gates.length} gates
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.delivery.gates.map((gate) => (
                      <DeliveryGateCard key={gate.id} gate={gate} />
                    ))}
                  </div>
                </Panel>

                <Panel tone="white">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                    Operator Handoff Note
                  </p>
                  <div className="mt-4 rounded-[20px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-4 py-4 shadow-[var(--shock-shadow-sm)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-[22px] font-bold">{detail.delivery.handoffNote.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                          {detail.delivery.handoffNote.summary}
                        </p>
                      </div>
                      <span
                        data-testid="delivery-handoff-status"
                        className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                      >
                        {detail.delivery.releaseReady ? "ready to hand off" : "handoff blocked"}
                      </span>
                    </div>
                    <ul data-testid="delivery-handoff-note" className="mt-4 space-y-2">
                      {detail.delivery.handoffNote.lines.map((line) => (
                        <li key={line} className="rounded-[14px] border border-[var(--shock-ink)] bg-white px-3 py-3 text-sm leading-6">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Panel>

                <Panel tone="paper">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                        Delivery Delegation
                      </p>
                      <p className="mt-2 font-display text-[22px] font-bold">
                        {detail.delivery.delegation.targetAgent || "Waiting For Delegate"}
                      </p>
                      <p
                        data-testid="delivery-delegation-summary"
                        className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]"
                      >
                        {detail.delivery.delegation.summary}
                      </p>
                    </div>
                    <span
                      data-testid="delivery-delegation-status"
                      className={cn(
                        "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                        delegationStatusTone(detail.delivery.delegation.status)
                      )}
                    >
                      {delegationStatusLabel(detail.delivery.delegation.status)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {detail.delivery.delegation.targetLane ? (
                      <span
                        data-testid="delivery-delegation-target"
                        className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]"
                      >
                        {detail.delivery.delegation.targetLane} · {detail.delivery.delegation.targetAgent || "unmapped"}
                      </span>
                    ) : null}
                    {detail.delivery.delegation.handoffStatus ? (
                      <span
                        data-testid="delivery-delegation-handoff-status"
                        className={cn(
                          "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                          delegationHandoffStatusTone(detail.delivery.delegation.handoffStatus)
                        )}
                      >
                        {delegationHandoffStatusLabel(detail.delivery.delegation.handoffStatus)}
                      </span>
                    ) : null}
                    {detail.delivery.delegation.responseHandoffStatus ? (
                      <span
                        data-testid="delivery-delegation-response-status"
                        className={cn(
                          "border border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                          delegationResponseStatusTone(detail.delivery.delegation.responseHandoffStatus)
                        )}
                      >
                        {delegationResponseStatusLabel(detail.delivery.delegation.responseHandoffStatus)}
                      </span>
                    ) : null}
                    {detail.delivery.delegation.responseAttemptCount ? (
                      <span
                        data-testid="delivery-delegation-response-attempts"
                        className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                      >
                        reply x{detail.delivery.delegation.responseAttemptCount}
                      </span>
                    ) : null}
                    {(detail.delivery.delegation.handoffHref || detail.delivery.delegation.href) ? (
                      <Link
                        href={detail.delivery.delegation.handoffHref || detail.delivery.delegation.href || "#"}
                        data-testid="delivery-delegation-open"
                        className="border border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-2 py-1 font-mono text-[10px]"
                      >
                        {detail.delivery.delegation.handoffHref ? "Open Delegated Handoff" : "Open Delivery Context"}
                      </Link>
                    ) : null}
                    {detail.delivery.delegation.responseHandoffHref ? (
                      <Link
                        href={detail.delivery.delegation.responseHandoffHref}
                        data-testid="delivery-delegation-response-open"
                        className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]"
                      >
                        Open Unblock Reply
                      </Link>
                    ) : null}
                  </div>
                </Panel>

                <Panel tone="white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                        Delivery Collaboration Thread
                      </p>
                      <p className="mt-2 font-display text-[22px] font-bold">Parent Closeout / Unblock Reply Timeline</p>
                    </div>
                    <span className="border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                      <span data-testid="delivery-communication-count">
                        {detail.delivery.delegation.communication?.length ?? 0}
                      </span>{" "}
                      entries
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.delivery.delegation.communication?.length ? (
                      detail.delivery.delegation.communication.map((entry) => (
                        <DeliveryCommunicationCard key={entry.id} entry={entry} />
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                        当前还没有 formal delivery collaboration thread；一旦 delegated closeout / unblock reply 起单，这里会按时间顺序回放 parent 与 child 的正式沟通。
                      </p>
                    )}
                  </div>
                </Panel>

                <DeliveryThreadActionSurface detail={detail} />

                <Panel tone="paper">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                        Review Conversation
                      </p>
                      <p className="mt-2 font-display text-[22px] font-bold">Comment / Thread Timeline</p>
                    </div>
                    <span className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                      <span data-testid="pull-request-conversation-count">{detail.conversation.length}</span> entries
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {detail.conversation.length === 0 ? (
                      <p className="text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                        当前还没有持久化 review/comment/thread ledger。后续 webhook replay 或 fresh webhook delivery 会把 exact conversation backfill 到这里。
                      </p>
                    ) : (
                      detail.conversation.map((entry) => (
                        <article
                          key={entry.id}
                          data-testid={`pull-request-conversation-entry-${entry.id}`}
                          className="border-2 border-[var(--shock-ink)] bg-white px-4 py-4 shadow-[var(--shock-shadow-sm)]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full border border-[var(--shock-ink)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]",
                                conversationTone(entry.kind)
                              )}
                            >
                              {conversationKindLabel(entry.kind)}
                            </span>
                            <span className="font-mono text-[10px] text-[color:rgba(24,20,14,0.56)]">{entry.author}</span>
                            <span className="font-mono text-[10px] text-[color:rgba(24,20,14,0.56)]">{entry.updatedAt || "刚刚"}</span>
                            {entry.threadStatus ? (
                              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                                {entry.threadStatus}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-6">{entry.summary}</p>
                          {entry.body ? (
                            <p className="mt-3 rounded-[12px] border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-3 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                              {entry.body}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {entry.path ? (
                              <span className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]">
                                {entry.path}
                                {entry.line ? `:${entry.line}` : ""}
                              </span>
                            ) : null}
                            {entry.reviewDecision ? (
                              <span className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]">
                                {entry.reviewDecision}
                              </span>
                            ) : null}
                            {entry.url ? (
                              <Link
                                href={entry.url}
                                target="_blank"
                                rel="noreferrer"
                                className="border border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-2 py-1 font-mono text-[10px]"
                              >
                                Remote Comment
                              </Link>
                            ) : null}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </Panel>
              </div>

              <div className="space-y-4">
                <Panel tone="yellow">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                    Delivery Templates
                  </p>
                  <div className="mt-4 space-y-3">
                    {detail.delivery.templates.length === 0 ? (
                      <p className="text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                        当前还没有和这条 PR 关联的 notification template / receipt truth。
                      </p>
                    ) : (
                      detail.delivery.templates.map((template) => (
                        <DeliveryTemplateCard key={`${template.templateId || template.label}-${template.status}`} template={template} />
                      ))
                    )}
                  </div>
                </Panel>

                <Panel tone="white">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                    Customer-facing Evidence Bundle
                  </p>
                  <div className="mt-4 space-y-3">
                    {detail.delivery.evidence.map((item) => (
                      <DeliveryEvidenceCard key={item.id} item={item} />
                    ))}
                  </div>
                </Panel>

                <Panel tone="yellow">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                    Related Inbox Signals
                  </p>
                  <div className="mt-4 space-y-3">
                    {detail.relatedInbox.length === 0 ? (
                      <p className="text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
                        当前没有和这条 PR 直接关联的 inbox signal。
                      </p>
                    ) : (
                      detail.relatedInbox.map((item) => (
                        <div key={item.id} data-testid={`pull-request-related-inbox-${item.id}`} className="border-2 border-[var(--shock-ink)] bg-white px-3 py-3">
                          <p className="font-display text-[18px] font-bold">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{item.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="border border-[var(--shock-ink)] bg-[var(--shock-paper)] px-2 py-1 font-mono text-[10px]">
                              {item.kind}
                            </span>
                            <Link
                              href={item.href}
                              className="border border-[var(--shock-ink)] bg-white px-2 py-1 font-mono text-[10px]"
                            >
                              Open Context
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>

                <Panel tone="white">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:rgba(24,20,14,0.56)]">
                    Context Back-links
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-3">
                      <p className="font-display text-[18px] font-bold">{detail.room.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{detail.room.summary}</p>
                    </div>
                    <div className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-3">
                      <p className="font-display text-[18px] font-bold">{detail.run.id}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{detail.run.summary}</p>
                    </div>
                    <div className="rounded-[14px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-3">
                      <p className="font-display text-[18px] font-bold">{detail.issue.key}</p>
                      <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">{detail.issue.summary}</p>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          </>
        )}
      </div>
    </OpenShockShell>
  );
}
