import { notFound } from "next/navigation";

import { OpenShockShell } from "@/components/open-shock-shell";
import { AgentDetailView, DetailRail } from "@/components/phase-zero-views";
import { getAgentById, getRunsForAgent } from "@/lib/mock-data";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgentById(agentId);

  if (!agent) notFound();

  return (
    <OpenShockShell
      view="agents"
      eyebrow="Agent detail"
      title={agent.name}
      description={agent.description}
      contextTitle={agent.lane}
      contextDescription="This is the lane the agent currently owns. A lane is visible to humans through room, run, and inbox state."
      contextBody={
        <DetailRail
          label="Binding"
          items={[
            { label: "Provider", value: agent.provider },
            { label: "Runtime", value: agent.runtimePreference },
            { label: "Mood", value: agent.mood },
            { label: "State", value: agent.state },
          ]}
        />
      }
    >
      <AgentDetailView agent={agent} runsForAgent={getRunsForAgent(agent.id)} />
    </OpenShockShell>
  );
}
