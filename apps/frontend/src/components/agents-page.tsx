import { getBootstrap } from "@/lib/api";
import { AgentManagementPanel } from "@/components/agent-management-panel";
import { ShellFrame } from "@/components/shell-frame";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCurrentSessionToken } from "@/lib/operator-server";

export async function AgentsPage() {
  const sessionToken = await getCurrentSessionToken();
  const bootstrap = await getBootstrap({ sessionToken });

  return (
    <ShellFrame
      workspaceId={bootstrap.workspace.id}
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      directRooms={bootstrap.directRooms}
      alignedTopRows
      footerPanel={null}
      rightRailWidthClass="md:grid-cols-[minmax(0,1fr)_300px]"
      activeRoute="/agents"
      title="Agent Management"
      headerMeta={
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <span className="shrink-0 text-[12px] font-medium text-black/58">
            {bootstrap.agents.length} agents
          </span>
        </div>
      }
      rightRail={
        <div className="space-y-2.5 p-3">
          <Card className="rounded-[12px] px-3 py-2.5">
            <Eyebrow>Agents</Eyebrow>
            <div className="mt-2.5 grid gap-2">
              <div className="rounded-[10px] border border-[var(--border)] bg-white px-2.5 py-2">
                <div className="action-card-label">Registered agents</div>
                <div className="action-card-value mt-1">{bootstrap.agents.length}</div>
              </div>
              <div className="rounded-[10px] border border-[var(--border)] bg-white px-2.5 py-2 text-[12px] leading-5 text-black/70">
                {bootstrap.rooms.length} rooms
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <div className="space-y-2.5 px-3 py-3">
        <div className="mx-auto w-full max-w-5xl">
          <AgentManagementPanel agents={bootstrap.agents} />
        </div>
      </div>
    </ShellFrame>
  );
}
