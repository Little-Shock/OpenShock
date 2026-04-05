import { notFound } from "next/navigation";

import { OpenShockShell } from "@/components/open-shock-shell";
import { DetailRail, RunDetailView } from "@/components/phase-zero-views";
import { getRoomById, getRunById } from "@/lib/mock-data";

export default async function RunPage({
  params,
}: {
  params: Promise<{ roomId: string; runId: string }>;
}) {
  const { roomId, runId } = await params;
  const room = getRoomById(roomId);
  const run = getRunById(runId);

  if (!room || !run || run.roomId !== room.id) notFound();

  return (
    <OpenShockShell
      view="rooms"
      eyebrow="Run detail"
      title={run.id}
      description="Run detail is the truth surface: runtime, branch, worktree, logs, tool calls, approval state, and closure target."
      selectedRoomId={room.id}
      contextTitle={run.issueKey}
      contextDescription="Every active Topic produces a visible run. Humans should be able to locate failure in under thirty seconds."
      contextBody={
        <DetailRail
          label="Execution lane"
          items={[
            { label: "Owner", value: run.owner },
            { label: "Provider", value: run.provider },
            { label: "Started", value: run.startedAt },
            { label: "Duration", value: run.duration },
          ]}
        />
      }
    >
      <RunDetailView run={run} />
    </OpenShockShell>
  );
}
