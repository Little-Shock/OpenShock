import { RoomQuickCreate } from "@/components/room-quick-create";
import { ShellFrame } from "@/components/shell-frame";
import { WorkspaceRepoBinding } from "@/components/workspace-repo-binding";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import type { BootstrapResponse, Member } from "@/lib/types";

export function FirstRunPage({
  bootstrap,
  member,
}: {
  bootstrap: BootstrapResponse;
  member: Member;
}) {
  return (
    <ShellFrame
      workspaceId={bootstrap.workspace.id}
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      directRooms={bootstrap.directRooms}
      alignedTopRows
      activeRoute="/"
      title="First Run Setup"
      subtitle="The workspace starts with the default all and annoucement rooms. Finish the initial setup before jumping into execution."
      rightRail={
        <div className="space-y-3.5 p-3.5">
          <Card className="rounded-[18px] px-3.5 py-3.5">
            <Eyebrow>Signed In</Eyebrow>
            <div className="display-font mt-2 text-xl font-black">{member.displayName}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-black/45">
              @{member.username}
            </div>
          </Card>
          <Card className="rounded-[18px] px-3.5 py-3.5">
            <Eyebrow>Checklist</Eyebrow>
            <div className="mt-3 space-y-2">
              <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5 text-[13px] text-black/72">
                1. Create the first working room for your task or issue
              </div>
              <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5 text-[13px] text-black/72">
                2. Bind default workspace repo
              </div>
              <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5 text-[13px] text-black/72">
                3. Post first member message
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-[20px] px-4 py-4">
          <Eyebrow>Create Working Room</Eyebrow>
          <p className="mt-2 text-[13px] leading-6 text-black/65">
            The workspace already includes the shared all and annoucement channels. Create a dedicated discussion room or issue room for actual work.
          </p>
          <div className="mt-4">
            <RoomQuickCreate workspaceId={bootstrap.workspace.id} />
          </div>
        </Card>
        <Card className="rounded-[20px] px-4 py-4">
          <Eyebrow>Bind Workspace Repo</Eyebrow>
          <p className="mt-2 text-[13px] leading-6 text-black/65">
            Set one canonical repository path so runs, merge, and delivery share the same source.
          </p>
          <div className="mt-4">
            <WorkspaceRepoBinding
              workspaceId={bootstrap.workspace.id}
              bindings={bootstrap.workspace.repoBindings}
            />
          </div>
        </Card>
      </div>
    </ShellFrame>
  );
}
