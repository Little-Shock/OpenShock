import { SettingsPage } from "@/components/settings-page";
import { requireAuthenticatedMember } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function SettingsRoutePage() {
  await requireAuthenticatedMember("/settings");
  return <SettingsPage />;
}
