import { OpenShockShell } from "@/components/open-shock-shell";
import { DetailRail, SettingsView } from "@/components/phase-zero-views";

export default function SettingsPage() {
  return (
    <OpenShockShell
      view="settings"
      eyebrow="Global settings"
      title="Policy before magic"
      description="Phase 0 keeps the operational knobs visible: identity, sandbox defaults, memory mode, and notification rules."
      contextTitle="Current stack"
      contextDescription="Frontend is Next.js. Backend is planned in Go. Local daemon is planned in Go. This shell models the product contract before the live services land."
      contextBody={
        <DetailRail
          label="Runtime stack"
          items={[
            { label: "Web", value: "Next.js 16" },
            { label: "API", value: "Go (planned)" },
            { label: "Daemon", value: "Go (planned)" },
            { label: "Memory", value: "file-first" },
          ]}
        />
      }
    >
      <SettingsView />
    </OpenShockShell>
  );
}
