import { OpenShockShell } from "@/components/open-shock-shell";
import { LiveBridgeConsole } from "@/components/live-bridge-console";
import { DetailRail, SetupOverview } from "@/components/phase-zero-views";

export default function SetupPage() {
  return (
    <OpenShockShell
      view="setup"
      eyebrow="Phase 0 setup"
      title="Connect the real lane"
      description="This is the operational spine of Phase 0: identity, repo binding, runtime pairing, and the first PR closure loop."
      contextTitle="Workspace live"
      contextDescription="Phase 0 is successful when a real local runtime can take an issue from room creation to run truth and PR closure."
      contextBody={
        <DetailRail
          label="Setup checkpoint"
          items={[
            { label: "Identity", value: "Email first" },
            { label: "Repo", value: "GitHub connected" },
            { label: "Runtime", value: "shock-main online" },
            { label: "PR loop", value: "mocked / next" },
          ]}
        />
      }
    >
      <div className="space-y-4">
        <SetupOverview />
        <LiveBridgeConsole />
      </div>
    </OpenShockShell>
  );
}
