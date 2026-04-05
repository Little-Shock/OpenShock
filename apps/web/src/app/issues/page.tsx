import { OpenShockShell } from "@/components/open-shock-shell";
import { DetailRail, IssuesListView } from "@/components/phase-zero-views";

export default function IssuesPage() {
  return (
    <OpenShockShell
      view="issues"
      eyebrow="Issue registry"
      title="Own the room before the work owns you"
      description="Issues are still the durable planning unit. The difference is that every serious issue automatically becomes a room with a visible run lane."
      contextTitle="Issue -> Room"
      contextDescription="In Phase 0, every issue gets one room and one default topic. PRs do not need one-to-one session binding."
      contextBody={
        <DetailRail
          label="Issue model"
          items={[
            { label: "Issue -> Room", value: "1:1" },
            { label: "Room -> Topic", value: "1:1 in P0" },
            { label: "Session", value: "internal only" },
            { label: "PR binding", value: "room-centric" },
          ]}
        />
      }
    >
      <IssuesListView />
    </OpenShockShell>
  );
}
