import { OpenShockShell } from "@/components/open-shock-shell";
import { DetailRail, InboxGrid } from "@/components/phase-zero-views";
import { inboxItems } from "@/lib/mock-data";

export default function InboxPage() {
  return (
    <OpenShockShell
      view="inbox"
      eyebrow="Human intervention lane"
      title="Inbox"
      description="Everything requiring human judgment lands here: blocked runs, approvals, review prompts, and major status changes."
      contextTitle="Inbox defaults"
      contextDescription="Inbox gets every system event. Browser push stays reserved for high-urgency items so the signal survives."
      contextBody={
        <DetailRail
          label="Notification policy"
          items={[
            { label: "Inbox", value: "all events" },
            { label: "Push", value: "urgent only" },
            { label: "Email", value: "later phase" },
            { label: "Mailbox", value: "future" },
          ]}
        />
      }
    >
      <InboxGrid items={inboxItems} />
    </OpenShockShell>
  );
}
