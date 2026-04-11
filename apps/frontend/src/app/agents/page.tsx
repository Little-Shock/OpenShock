import { AgentsPage } from "@/components/agents-page";
import { requireAuthenticatedMember } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function AgentsRoutePage() {
  await requireAuthenticatedMember("/agents");
  return <AgentsPage />;
}
