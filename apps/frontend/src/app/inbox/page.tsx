import { InboxPage } from "@/components/inbox-page";
import { requireAuthenticatedMember } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function InboxRoutePage() {
  await requireAuthenticatedMember("/inbox");
  return <InboxPage />;
}
