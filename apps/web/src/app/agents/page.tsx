import { OpenShockShell } from "@/components/open-shock-shell";
import { AgentsListView, DetailRail } from "@/components/phase-zero-views";

export default function AgentsPage() {
  return (
    <OpenShockShell
      view="agents"
      eyebrow="Agent registry"
      title="First-class citizens, not hidden tools"
      description="Agents are visible actors with runtime preferences, memory bindings, and observable recent runs."
      contextTitle="Agent contract"
      contextDescription="Phase 0 keeps the agent model simple but explicit: name, provider, runtime preference, memory spaces, and recent execution truth."
      contextBody={
        <DetailRail
          label="Registry shape"
          items={[
            { label: "Identity", value: "name + role" },
            { label: "Runtime pref", value: "machine-level" },
            { label: "Memory", value: "file spaces only" },
            { label: "Runs", value: "visible history" },
          ]}
        />
      }
    >
      <AgentsListView />
    </OpenShockShell>
  );
}
