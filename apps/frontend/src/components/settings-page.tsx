import { getBootstrap } from "@/lib/api";
import { OperatorProfilePanel } from "@/components/operator-profile-panel";
import { ShellFrame } from "@/components/shell-frame";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { WorkspaceRepoBinding } from "@/components/workspace-repo-binding";
import { getCurrentSessionToken } from "@/lib/operator-server";

function statusTone(status: string) {
  switch (status) {
    case "online":
    case "ready":
      return "green";
    case "busy":
    case "running":
      return "blue";
    default:
      return "neutral";
  }
}

function SettingsFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-black/42">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-semibold text-black/82">{value}</div>
    </div>
  );
}

export async function SettingsPage() {
  const sessionToken = await getCurrentSessionToken();
  const bootstrap = await getBootstrap({ sessionToken });
  const defaultRepo = bootstrap.workspace.repoBindings.find((binding) => binding.isDefault);
  const onlineRuntimes = bootstrap.runtimes.filter((runtime) => runtime.status === "online");
  const busyRuntimes = bootstrap.runtimes.filter((runtime) => runtime.status === "busy");
  const issueRoomCount = bootstrap.rooms.filter((room) => room.kind === "issue").length;
  const discussionRoomCount = bootstrap.rooms.filter(
    (room) => room.kind === "discussion",
  ).length;

  return (
    <ShellFrame
      workspaceId={bootstrap.workspace.id}
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      directRooms={bootstrap.directRooms}
      alignedTopRows
      footerPanel={null}
      rightRailWidthClass="md:grid-cols-[minmax(0,1fr)_360px]"
      activeRoute="/settings"
      title="Settings"
      headerMeta={
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <span className="shrink-0 text-[12px] font-medium text-black/58">
            {bootstrap.rooms.length} rooms
          </span>
          <span className="shrink-0 text-[12px] font-medium text-black/52">
            {bootstrap.agents.length} agents
          </span>
          <span className="shrink-0 text-[12px] font-medium text-black/52">
            {bootstrap.workspace.repoBindings.length} repo bindings
          </span>
        </div>
      }
      rightRail={
        <div className="space-y-3.5 p-3.5">
          <Card className="rounded-[12px] px-3 py-2.5">
            <Eyebrow>Workspace</Eyebrow>
            <div className="display-font mt-2 text-2xl font-black">
              {bootstrap.workspace.name}
            </div>
          </Card>
          <Card className="rounded-[12px] px-3 py-2.5">
            <Eyebrow>Default Repo</Eyebrow>
            <div className="display-font mt-2 text-lg font-black">
              {defaultRepo?.label || "Missing"}
            </div>
            {defaultRepo?.repoPath ? (
              <p className="mt-2 text-[13px] leading-6 text-black/72">{defaultRepo.repoPath}</p>
            ) : null}
          </Card>
          <Card className="rounded-[12px] px-3 py-2.5">
            <Eyebrow>Runtime Readiness</Eyebrow>
            <div className="mt-3 grid gap-2">
              <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                <div className="action-card-label">Online</div>
                <div className="action-card-value mt-1">{onlineRuntimes.length}</div>
              </div>
              <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                <div className="action-card-label">Busy</div>
                <div className="action-card-value mt-1">{busyRuntimes.length}</div>
              </div>
              <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                <div className="action-card-label">Total</div>
                <div className="action-card-value mt-1">{bootstrap.runtimes.length}</div>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <div className="space-y-3 px-3 py-3">
        <div className="mx-auto w-full max-w-4xl space-y-2.5">
          <OperatorProfilePanel />

          <Card className="rounded-[12px] px-4 py-4 shadow-[0_4px_12px_rgba(31,35,41,0.04)]">
            <Eyebrow className="mb-3">Workspace Footprint</Eyebrow>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SettingsFact label="Issue Rooms" value={String(issueRoomCount)} />
              <SettingsFact label="Discussion Rooms" value={String(discussionRoomCount)} />
              <SettingsFact label="Agents Visible" value={String(bootstrap.agents.length)} />
              <SettingsFact
                label="Repo Bindings"
                value={String(bootstrap.workspace.repoBindings.length)}
              />
            </div>
          </Card>

          <WorkspaceRepoBinding
            workspaceId={bootstrap.workspace.id}
            bindings={bootstrap.workspace.repoBindings}
          />

          <Card className="rounded-[12px] px-4 py-4 shadow-[0_4px_12px_rgba(31,35,41,0.04)]">
            <Eyebrow className="mb-3">Registered Runtimes</Eyebrow>
            <div className="space-y-2">
              {bootstrap.runtimes.map((runtime) => (
                <div
                  key={runtime.id}
                  className="flex flex-col gap-2 rounded-[12px] border border-[var(--border)] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-black/82">{runtime.name}</div>
                    <div className="mt-1 text-[12px] text-black/55">
                      {runtime.provider} · {runtime.id}
                    </div>
                  </div>
                  <Badge tone={statusTone(runtime.status)}>{runtime.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </ShellFrame>
  );
}
