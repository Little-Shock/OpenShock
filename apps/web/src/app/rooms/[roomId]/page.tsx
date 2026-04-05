import { notFound } from "next/navigation";

import { OpenShockShell } from "@/components/open-shock-shell";
import { DetailRail, RoomOverview } from "@/components/phase-zero-views";
import { getRoomById, getRunById } from "@/lib/mock-data";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = getRoomById(roomId);

  if (!room) notFound();

  const run = getRunById(room.runId);

  return (
    <OpenShockShell
      view="rooms"
      eyebrow="Issue room"
      title={room.title}
      description={room.summary}
      selectedRoomId={room.id}
      contextTitle={room.issueKey}
      contextDescription="Issue -> Room is the first-class user model. Topic stays visible. Session remains a system concern."
      contextBody={
        <DetailRail
          label="Run detail"
          items={[
            { label: "Runtime", value: run?.runtime ?? "waiting" },
            { label: "Branch", value: run?.branch ?? "waiting" },
            { label: "Worktree", value: run?.worktree ?? "waiting" },
            { label: "PR", value: run?.pullRequest ?? "waiting" },
          ]}
        />
      }
    >
      <RoomOverview room={room} />
    </OpenShockShell>
  );
}
