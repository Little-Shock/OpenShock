import { getBootstrap, getInbox } from "@/lib/api";
import { InboxActionButton } from "@/components/inbox-action-button";
import type { InboxItem } from "@/lib/types";
import { LiveRefresh } from "@/components/live-refresh";
import { ShellFrame } from "@/components/shell-frame";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

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
    <Card className={`rounded-[18px] px-4 py-4 ${severityStyles(item.severity)}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <Eyebrow className="mb-1.5">
            {item.kind.replace("_", " ")} · {item.severity} severity
          </Eyebrow>
          <div className="display-font text-lg font-black">{item.title}</div>
          <p className="mt-2 text-[13px] leading-6 text-black/75">{item.summary}</p>
        </div>
        <InboxActionButton item={item} />
      </div>
    </Card>
  );
}

export async function InboxPage() {
  const [bootstrap, inbox] = await Promise.all([getBootstrap(), getInbox()]);
  const realtimeScopes = [`workspace:${bootstrap.workspace.id}`, "inbox:default"];

  return (
    <ShellFrame
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      agents={bootstrap.agents}
      activeRoute="/inbox"
      title="Human Inbox"
      subtitle="Only the actions that need a human decision, correction, or final authority should land here."
      rightRail={
        <div className="space-y-3.5 p-3.5">
          <Card className="rounded-[18px] px-3.5 py-3.5">
            <Eyebrow>Pending Decisions</Eyebrow>
            <div className="display-font mt-2 text-4xl font-black">
              {inbox.items.length}
            </div>
          </Card>
          <Card className="rounded-[18px] px-3.5 py-3.5">
            <Eyebrow>Filter Mode</Eyebrow>
            <p className="mt-2 text-[13px] leading-6 text-black/75">
              Bypassing automated filters. Only showing items that require unique
              authority, creative input, or high-level conflict resolution.
            </p>
          </Card>
        </div>
      }
    >
      <div className="space-y-3 p-4">
        <LiveRefresh scopes={realtimeScopes} />
        {inbox.items.map((item) => (
          <InboxCard key={item.id} item={item} />
        ))}
      </div>
    </ShellFrame>
  );
}
