import { OpenShockShell } from "@/components/open-shock-shell";
import { BoardView, DetailRail } from "@/components/phase-zero-views";

export default function BoardPage() {
  return (
    <OpenShockShell
      view="board"
      eyebrow="Secondary control surface"
      title="Board"
      description="Board exists to support rooms, not replace them. It is a control view, not the brand identity of the product."
      contextTitle="Board-second rule"
      contextDescription="OpenShock stays chat-first and room-first. Board helps scan execution state, but conversation and run truth remain primary."
      contextBody={
        <DetailRail
          label="Board contract"
          items={[
            { label: "Primary UX", value: "chat + room" },
            { label: "Board role", value: "secondary control" },
            { label: "Hidden model", value: "session internal" },
            { label: "Closure", value: "PR in room context" },
          ]}
        />
      }
    >
      <BoardView />
    </OpenShockShell>
  );
}
