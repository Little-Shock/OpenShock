import type {
  AgentSession,
  AgentTurn,
  AgentWait,
  HandoffRecord,
  RoomSummary,
  Runtime,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

type RoomSystemPanelProps = {
  room: RoomSummary;
  runtimes: Runtime[];
  sessions: AgentSession[];
  turns: AgentTurn[];
  waits: AgentWait[];
  handoffs: HandoffRecord[];
  messageCount: number;
};

function metricCard(label: string, value: number, hint: string) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-white px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-black/45">{label}</div>
      <div className="display-font mt-1 text-lg font-black">{value}</div>
      <div className="mt-1 text-[10px] leading-4 text-black/55">{hint}</div>
    </div>
  );
}

export function RoomSystemPanel({
  room,
  runtimes,
  sessions,
  turns,
  waits,
  handoffs,
  messageCount,
}: RoomSystemPanelProps) {
  const onlineRuntimes = runtimes.filter((runtime) => runtime.status === "online").length;
  const busyRuntimes = runtimes.filter((runtime) => runtime.status === "busy").length;
  const queuedTurns = turns.filter((turn) => turn.status === "queued").length;
  const claimedTurns = turns.filter((turn) => turn.status === "claimed").length;
  const respondingSessions = sessions.filter((session) => session.status === "responding").length;
  const waitingHuman = waits.filter((wait) => wait.status === "waiting_human").length;
  const handoffsOpen = handoffs.filter((handoff) => handoff.status !== "accepted").length;

  return (
    <section className="border-t border-[var(--border)] pt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Eyebrow className="tracking-[0.18em]">System Panel</Eyebrow>
        <Badge tone="dark">{room.kind}</Badge>
      </div>

      <Card className="rounded-[12px] px-2.5 py-2.5">
        <div className="mb-2.5 grid gap-2">
          {metricCard("Messages", messageCount, "chat events in this room")}
          {metricCard("Sessions", sessions.length, "agent contexts live here")}
          {metricCard("Queued Turns", queuedTurns, "waiting for daemon claim")}
          {metricCard("Waiting Human", waitingHuman, "blocked on human response")}
        </div>

        <div className="space-y-1.5 border-t border-[var(--border)] pt-2.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-black/55">Runtime health</span>
            <span className="font-medium text-black/75">
              {onlineRuntimes} online · {busyRuntimes} busy
            </span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-black/55">Responding sessions</span>
            <span className="font-medium text-black/75">{respondingSessions}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-black/55">Claimed turns</span>
            <span className="font-medium text-black/75">{claimedTurns}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-black/55">Open handoffs</span>
            <span className="font-medium text-black/75">{handoffsOpen}</span>
          </div>
        </div>
      </Card>
    </section>
  );
}
