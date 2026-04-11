import { getBootstrap, getInbox } from "@/lib/api";
import { InboxActionButton } from "@/components/inbox-action-button";
import type { InboxItem } from "@/lib/types";
import { LiveRefresh } from "@/components/live-refresh";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCurrentSessionToken } from "@/lib/operator-server";

function severityStyles(severity: string) {
  switch (severity) {
    case "high":
      return "border-[var(--accent-blue)]/10 bg-[var(--surface-strong)]";
    case "medium":
      return "border-[var(--accent-purple)]/20 bg-white";
    default:
      return "border-[var(--border)] bg-white";
  }
}

function InboxCard({ item }: { item: InboxItem }) {
  return (
    <Card className={`rounded-[12px] px-4 py-4 shadow-[0_4px_12px_rgba(31,35,41,0.04)] ${severityStyles(item.severity)}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge tone={item.severity === "high" ? "orange" : item.severity === "medium" ? "purple" : "neutral"}>
              {item.severity}
            </Badge>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
              {item.kind.replace("_", " ")}
            </span>
          </div>
          <div className="display-font text-lg font-black">{item.title}</div>
          <p className="mt-2 text-[13px] leading-6 text-black/75">{item.summary}</p>
        </div>
        <InboxActionButton item={item} />
      </div>
    </Card>
  );
}

export async function InboxPage() {
  const sessionToken = await getCurrentSessionToken();
  const [bootstrap, inbox] = await Promise.all([
    getBootstrap({ sessionToken }),
    getInbox({ sessionToken }),
  ]);
  const realtimeScopes = [`workspace:${bootstrap.workspace.id}`, "inbox:default"];
  const actionableItems = inbox.items.filter(
    (item) =>
      Boolean(item.primaryActionType) &&
      Boolean(item.relatedEntityType) &&
      Boolean(item.relatedEntityId),
  );
  const informationalItems = inbox.items.length - actionableItems.length;

  return (
    <ShellFrame
      workspaceId={bootstrap.workspace.id}
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      directRooms={bootstrap.directRooms}
      alignedTopRows
      footerPanel={null}
      rightRailWidthClass="md:grid-cols-[minmax(0,1fr)_360px]"
      activeRoute="/inbox"
      title="Inbox"
      headerMeta={
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Badge tone="purple">Human Queue</Badge>
          <span className="shrink-0 text-[12px] font-medium text-black/58">
            {actionableItems.length} actionable
          </span>
          <span className="shrink-0 text-[12px] font-medium text-black/52">
            {informationalItems} informational
          </span>
          <span className="truncate text-[13px] font-medium text-black/58">
            Review the items that need human approval, correction, or final judgment.
          </span>
        </div>
      }
      rightRail={
        <div className="space-y-3.5 p-3.5">
          <Card className="rounded-[12px] px-3 py-2.5">
            <Eyebrow>Needs Action</Eyebrow>
            <div className="display-font mt-2 text-4xl font-black">
              {actionableItems.length}
            </div>
          </Card>
          <Card className="rounded-[12px] px-3 py-2.5">
            <Eyebrow>Informational</Eyebrow>
            <div className="display-font mt-2 text-2xl font-black">
              {informationalItems}
            </div>
            <p className="mt-2 text-[13px] leading-6 text-black/75">
              Items without a direct action stay visible here for context, but do not
              block the human approval queue.
            </p>
          </Card>
        </div>
      }
    >
      <div className="space-y-3 px-3 py-3">
        <LiveRefresh scopes={realtimeScopes} />
        <div className="mx-auto w-full max-w-4xl space-y-2.5">
          {inbox.items.length > 0 ? (
            inbox.items.map((item) => <InboxCard key={item.id} item={item} />)
          ) : (
            <Card className="rounded-[12px] px-4 py-5 shadow-[0_4px_12px_rgba(31,35,41,0.04)]">
              <Eyebrow>Queue Clear</Eyebrow>
              <p className="mt-2 text-[13px] leading-6 text-black/68">
                There are no human decisions waiting right now.
              </p>
            </Card>
          )}
        </div>
      </div>
    </ShellFrame>
  );
}
