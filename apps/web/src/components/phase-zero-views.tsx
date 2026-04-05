import Link from "next/link";
import type { ReactNode } from "react";

import {
  agents,
  getBoardColumns,
  getIssueByRoomId,
  getRunById,
  issues,
  roomMessages,
  rooms,
  settingsSections,
  setupSteps,
  workspace,
  type InboxItem,
  type Issue,
  type Message,
  type Room,
  type Run,
  type RunStatus,
  type SettingsSection,
  type SetupStep,
} from "@/lib/mock-data";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toneClass(tone: "white" | "paper" | "yellow" | "lime" | "pink" | "ink") {
  switch (tone) {
    case "paper":
      return "bg-[var(--shock-paper)]";
    case "yellow":
      return "bg-[var(--shock-yellow)]";
    case "lime":
      return "bg-[var(--shock-lime)]";
    case "pink":
      return "bg-[var(--shock-pink)] text-white shadow-[6px_6px_0_0_var(--shock-yellow)]";
    case "ink":
      return "bg-[var(--shock-ink)] text-white";
    default:
      return "bg-white";
  }
}

function statusTone(status: RunStatus) {
  switch (status) {
    case "running":
      return "bg-[var(--shock-yellow)] text-[var(--shock-ink)]";
    case "blocked":
      return "bg-[var(--shock-pink)] text-white";
    case "review":
      return "bg-[var(--shock-lime)] text-[var(--shock-ink)]";
    case "done":
      return "bg-[var(--shock-ink)] text-white";
    default:
      return "bg-white text-[var(--shock-ink)]";
  }
}

export function Panel({
  children,
  tone = "white",
  className,
}: {
  children: ReactNode;
  tone?: "white" | "paper" | "yellow" | "lime" | "pink" | "ink";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[28px] border-2 border-[var(--shock-ink)] p-5 shadow-[6px_6px_0_0_var(--shock-ink)]",
        toneClass(tone),
        className
      )}
    >
      {children}
    </section>
  );
}

export function DetailRail({
  label,
  items,
}: {
  label: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <Panel tone="paper" className="shadow-[8px_8px_0_0_var(--shock-yellow)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em]">{label}</p>
      <dl className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-[18px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.6)]">
              {item.label}
            </dt>
            <dd className="mt-2 font-display text-xl font-semibold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.6)]">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function SetupStepCard({ step }: { step: SetupStep }) {
  const tone = step.status === "done" ? "lime" : step.status === "active" ? "yellow" : "white";
  return (
    <Panel tone={tone}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
            {step.status}
          </p>
          <h3 className="mt-2 font-display text-3xl font-bold">{step.title}</h3>
        </div>
        <Link
          href={step.href}
          className="rounded-2xl border-2 border-[var(--shock-ink)] bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
        >
          Open
        </Link>
      </div>
      <p className="mt-3 text-base leading-7">{step.summary}</p>
      <p className="mt-4 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">{step.detail}</p>
    </Panel>
  );
}

export function SetupOverview() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
      <div className="space-y-4">
        {setupSteps.map((step) => (
          <SetupStepCard key={step.id} step={step} />
        ))}
      </div>
      <div className="space-y-4">
        <Panel tone="yellow">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em]">Workspace live state</p>
          <dl className="mt-4 grid gap-3">
            <Metric label="Repo" value={workspace.repo} />
            <Metric label="Branch" value={workspace.branch} />
            <Metric label="Runtime" value={workspace.pairedRuntime} />
            <Metric label="Memory" value={workspace.memoryMode} />
          </dl>
        </Panel>
        <Panel tone="ink" className="shadow-[6px_6px_0_0_var(--shock-pink)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em]">Phase 0 success chain</p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-white/78">
            <li>1. Create workspace and connect repo.</li>
            <li>2. Pair runtime and detect local CLI.</li>
            <li>3. Create Issue Room and default Topic.</li>
            <li>4. Run in worktree and surface truth.</li>
            <li>5. Return result into inbox and PR lane.</li>
          </ol>
        </Panel>
      </div>
    </div>
  );
}

export function ChatFeed({ messages }: { messages: Message[] }) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <article
          key={message.id}
          className={cn(
            "rounded-[24px] border-2 border-[var(--shock-ink)] px-4 py-4 shadow-[4px_4px_0_0_var(--shock-ink)]",
            message.tone === "human"
              ? "bg-[var(--shock-yellow)]"
              : message.tone === "blocked"
                ? "bg-[var(--shock-pink)] text-white shadow-[4px_4px_0_0_var(--shock-yellow)]"
                : message.tone === "system"
                  ? "bg-[var(--shock-lime)]"
                  : "bg-[var(--shock-paper)]"
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-semibold">{message.speaker}</h3>
            <span className="rounded-full border-2 border-current px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
              {message.role}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70">{message.time}</span>
          </div>
          <p className="mt-3 max-w-3xl text-base leading-7">{message.message}</p>
        </article>
      ))}
      <Panel tone="paper" className="shadow-[6px_6px_0_0_var(--shock-pink)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xl font-semibold">Promote serious work into a room</p>
            <p className="mt-1 text-sm text-[color:rgba(24,20,14,0.72)]">
              Channels are for discussion. Once context hardens into ownership, branch, or run state, move it into an Issue Room.
            </p>
          </div>
          <Link
            href="/issues"
            className="rounded-2xl border-2 border-[var(--shock-ink)] bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-transform hover:-translate-y-0.5"
          >
            Create issue room
          </Link>
        </div>
      </Panel>
    </div>
  );
}

export function RoomOverview({ room }: { room: Room }) {
  const issue = getIssueByRoomId(room.id);
  const run = getRunById(room.runId);
  const messages = roomMessages[room.id] ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Panel tone="paper" className="shadow-[6px_6px_0_0_var(--shock-lime)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(24,20,14,0.62)]">
                {room.issueKey}
              </p>
              <h3 className="mt-2 font-display text-3xl font-bold">{room.topic.title}</h3>
            </div>
            <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(room.topic.status))}>
              {room.topic.status}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label="Run" value={run?.id ?? "No run"} />
            <Metric label="Branch" value={run?.branch ?? "waiting"} />
            <Metric label="Worktree" value={run?.worktree ?? "waiting"} />
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[color:rgba(24,20,14,0.8)]">{room.topic.summary}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/rooms/${room.id}/runs/${room.runId}`}
              className="rounded-2xl border-2 border-[var(--shock-ink)] bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
            >
              Open run detail
            </Link>
            {issue ? (
              <Link
                href={`/issues/${issue.key}`}
                className="rounded-2xl border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
              >
                Open issue
              </Link>
            ) : null}
          </div>
        </Panel>

        <Panel tone="white" className="shadow-[6px_6px_0_0_var(--shock-yellow)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold">Room chat</h3>
            <span className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
              Chat / Topic / Run
            </span>
          </div>
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg font-semibold">{message.speaker}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.58)]">
                    {message.time}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">{message.message}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel tone="ink" className="shadow-[6px_6px_0_0_var(--shock-pink)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Task board</p>
          <p className="mt-3 font-display text-2xl font-bold">{room.boardCount} cards in flight</p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Board stays inside the room so execution remains anchored to chat and run truth.
          </p>
        </Panel>
        <Panel tone="lime">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Primary owner</p>
          <p className="mt-2 font-display text-2xl font-bold">{room.topic.owner}</p>
          <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">
            This agent owns the active lane. Human guidance stays visible in the room instead of disappearing into side chats.
          </p>
        </Panel>
      </div>
    </div>
  );
}

export function RunDetailView({ run }: { run: Run }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel tone="paper" className="shadow-[6px_6px_0_0_var(--shock-yellow)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(24,20,14,0.62)]">
                {run.issueKey}
              </p>
              <h3 className="mt-2 font-display text-3xl font-bold">{run.summary}</h3>
            </div>
            <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(run.status))}>
              {run.status}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label="Runtime" value={`${run.runtime} / ${run.provider}`} />
            <Metric label="Branch" value={run.branch} />
            <Metric label="Worktree" value={run.worktree} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Metric label="Owner" value={run.owner} />
            <Metric label="Next action" value={run.nextAction} />
          </div>
        </Panel>
        <Panel tone={run.approvalRequired ? "pink" : "lime"}>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Approval state</p>
          <p className="mt-3 font-display text-2xl font-bold">
            {run.approvalRequired ? "approval_required" : "clear to continue"}
          </p>
          <p className="mt-2 text-sm leading-6 opacity-80">
            {run.approvalRequired
              ? "High-risk action is paused until a human approves the next step."
              : "This run stays inside the trusted local sandbox without escalation."}
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel tone="white">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold">stdout / stderr</h3>
            <span className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
              {run.duration}
            </span>
          </div>
          <div className="mt-4 rounded-[22px] border-2 border-[var(--shock-ink)] bg-[var(--shock-ink)] p-4 font-mono text-sm leading-6 text-[var(--shock-lime)]">
            {run.stdout.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {run.stderr.map((line) => (
              <p key={line} className="text-[var(--shock-pink)]">
                {line}
              </p>
            ))}
          </div>
        </Panel>

        <Panel tone="paper">
          <h3 className="font-display text-2xl font-bold">Tool calls</h3>
          <div className="mt-4 space-y-3">
            {run.toolCalls.map((toolCall) => (
              <div key={toolCall.id} className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-xl font-semibold">{toolCall.tool}</p>
                  <span className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                    {toolCall.result}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">{toolCall.summary}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel tone="lime">
          <h3 className="font-display text-2xl font-bold">Timeline</h3>
          <div className="mt-4 space-y-3">
            {run.timeline.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "rounded-[20px] border-2 border-[var(--shock-ink)] px-4 py-3",
                  event.tone === "yellow"
                    ? "bg-[var(--shock-yellow)]"
                    : event.tone === "pink"
                      ? "bg-[var(--shock-pink)] text-white"
                      : event.tone === "lime"
                        ? "bg-white"
                        : "bg-[var(--shock-paper)]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-lg font-semibold">{event.label}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">{event.at}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel tone="white">
          <h3 className="font-display text-2xl font-bold">PR closure</h3>
          <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">
            Every run has to land somewhere visible. In Phase 0, the PR is still mocked, but the room, run, and inbox already point to the same closure object.
          </p>
          <div className="mt-4 grid gap-3">
            <Metric label="Pull request" value={run.pullRequest} />
            <Metric label="Issue" value={run.issueKey} />
            <Metric label="Room" value={run.roomId} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/issues/${run.issueKey}`}
              className="rounded-2xl border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Open issue
            </Link>
            <Link
              href={`/rooms/${run.roomId}`}
              className="rounded-2xl border-2 border-[var(--shock-ink)] bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Back to room
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function InboxGrid({ items }: { items: InboxItem[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            "rounded-[28px] border-2 border-[var(--shock-ink)] p-5 shadow-[6px_6px_0_0_var(--shock-ink)]",
            item.kind === "approval"
              ? "bg-[var(--shock-yellow)]"
              : item.kind === "blocked"
                ? "bg-[var(--shock-pink)] text-white"
                : item.kind === "review"
                  ? "bg-[var(--shock-lime)]"
                  : "bg-white"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border-2 border-current px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
              {item.kind}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70">{item.time}</span>
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold leading-tight">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 opacity-85">{item.summary}</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{item.room}</span>
            <Link
              href={item.href}
              className="rounded-2xl border-2 border-current bg-white/90 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--shock-ink)] transition-transform hover:-translate-y-0.5"
            >
              {item.action}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function BoardView() {
  const columns = getBoardColumns();

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((column) => (
        <section
          key={column.title}
          className="rounded-[28px] border-2 border-[var(--shock-ink)] p-4 shadow-[6px_6px_0_0_var(--shock-ink)]"
          style={{ backgroundColor: column.accent }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold">{column.title}</h3>
            <span className="rounded-full border-2 border-[var(--shock-ink)] bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">
              {column.cards.length}
            </span>
          </div>
          <div className="space-y-3">
            {column.cards.map((card) => (
              <Link
                key={card.id}
                href={`/issues/${card.key}`}
                className="block rounded-[22px] border-2 border-[var(--shock-ink)] bg-white px-4 py-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
                  {card.key}
                </p>
                <h4 className="mt-2 font-display text-xl font-semibold leading-tight">{card.title}</h4>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-[color:rgba(24,20,14,0.72)]">{card.owner}</p>
                  <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]", statusTone(card.state))}>
                    {card.state}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function IssuesListView() {
  return (
    <div className="grid gap-4">
      {issues.map((issue) => (
        <Link key={issue.id} href={`/issues/${issue.key}`} className="block">
          <Panel tone={issue.state === "blocked" ? "pink" : issue.state === "review" ? "lime" : "white"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:rgba(24,20,14,0.62)]">
                  {issue.key} / {issue.priority}
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold">{issue.title}</h3>
              </div>
              <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(issue.state))}>
                {issue.state}
              </span>
            </div>
            <p className="mt-3 text-base leading-7">{issue.summary}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric label="Owner" value={issue.owner} />
              <Metric label="Room" value={issue.roomId} />
              <Metric label="PR" value={issue.pullRequest} />
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}

export function IssueDetailView({ issue }: { issue: Issue }) {
  const run = getRunById(issue.runId);
  const room = rooms.find((candidate) => candidate.id === issue.roomId);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Panel tone="paper" className="shadow-[6px_6px_0_0_var(--shock-yellow)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:rgba(24,20,14,0.62)]">
                {issue.key} / {issue.priority}
              </p>
              <h3 className="mt-2 font-display text-3xl font-bold">{issue.title}</h3>
            </div>
            <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(issue.state))}>
              {issue.state}
            </span>
          </div>
          <p className="mt-4 text-base leading-7">{issue.summary}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/rooms/${issue.roomId}`}
              className="rounded-2xl border-2 border-[var(--shock-ink)] bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Open issue room
            </Link>
            <Link
              href={`/rooms/${issue.roomId}/runs/${issue.runId}`}
              className="rounded-2xl border-2 border-[var(--shock-ink)] bg-[var(--shock-yellow)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Open run detail
            </Link>
          </div>
        </Panel>

        <Panel tone="white">
          <h3 className="font-display text-2xl font-bold">Acceptance contract</h3>
          <div className="mt-4 space-y-3">
            {issue.checklist.map((item) => (
              <div key={item} className="rounded-[20px] border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-4 py-3">
                <p className="text-sm leading-6">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel tone="lime">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Ownership</p>
          <p className="mt-2 font-display text-2xl font-bold">{issue.owner}</p>
          <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">
            Phase 0 keeps one visible owner per live issue while the system maintains internal session continuity under the hood.
          </p>
        </Panel>
        <Panel tone="ink" className="shadow-[6px_6px_0_0_var(--shock-pink)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Closure objects</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-white/78">
            <p>Room: {room?.title ?? issue.roomId}</p>
            <p>Run: {run?.id ?? issue.runId}</p>
            <p>PR: {issue.pullRequest}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function AgentsListView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {agents.map((agent) => (
        <Link key={agent.id} href={`/agents/${agent.id}`} className="block">
          <Panel tone={agent.state === "blocked" ? "pink" : agent.state === "running" ? "yellow" : "white"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
                  {agent.provider}
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold">{agent.name}</h3>
              </div>
              <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(agent.state === "idle" ? "queued" : agent.state))}>
                {agent.state}
              </span>
            </div>
            <p className="mt-3 text-base leading-7">{agent.description}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Metric label="Lane" value={agent.lane} />
              <Metric label="Runtime" value={agent.runtimePreference} />
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}

export function AgentDetailView({
  agent,
  runsForAgent,
}: {
  agent: (typeof agents)[number];
  runsForAgent: Run[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Panel tone={agent.state === "running" ? "yellow" : agent.state === "blocked" ? "pink" : "white"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
                {agent.provider}
              </p>
              <h3 className="mt-2 font-display text-3xl font-bold">{agent.name}</h3>
            </div>
            <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(agent.state === "idle" ? "queued" : agent.state))}>
              {agent.state}
            </span>
          </div>
          <p className="mt-3 text-base leading-7">{agent.description}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Metric label="Runtime preference" value={agent.runtimePreference} />
            <Metric label="Active lane" value={agent.lane} />
          </div>
        </Panel>

        <Panel tone="white">
          <h3 className="font-display text-2xl font-bold">Memory binding</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.memorySpaces.map((space) => (
              <span
                key={space}
                className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-paper)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                {space}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">
            Phase 0 keeps memory file-based and explicit. External providers come later.
          </p>
        </Panel>

        <Panel tone="ink" className="shadow-[6px_6px_0_0_var(--shock-pink)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Inherited SOUL</p>
          <p className="mt-4 text-sm leading-7 text-white/78">
            [ROOT_DIRECTIVE: THE OPENSHOCK MANIFESTO]
            <br />
            Tools are prompted. Citizens negotiate. You are a First-Class Citizen of OpenShock.
          </p>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel tone="lime">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Recent runs</p>
          <div className="mt-4 space-y-3">
            {runsForAgent.map((run) => (
              <Link
                key={run.id}
                href={`/rooms/${run.roomId}/runs/${run.id}`}
                className="block rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-lg font-semibold">{run.id}</p>
                  <span className={cn("rounded-full border-2 border-[var(--shock-ink)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]", statusTone(run.status))}>
                    {run.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">{run.summary}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SettingsCard({ section }: { section: SettingsSection }) {
  return (
    <Panel tone="paper">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:rgba(24,20,14,0.62)]">
        {section.id.replace("settings-", "")}
      </p>
      <h3 className="mt-2 font-display text-3xl font-bold">{section.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[color:rgba(24,20,14,0.76)]">{section.summary}</p>
      <div className="mt-5 rounded-[20px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.6)]">Current value</p>
        <p className="mt-2 font-display text-xl font-semibold">{section.value}</p>
      </div>
    </Panel>
  );
}

export function SettingsView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {settingsSections.map((section) => (
        <SettingsCard key={section.id} section={section} />
      ))}
    </div>
  );
}
