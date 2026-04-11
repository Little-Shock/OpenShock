import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function ProfileRoutePage() {
  await requireAuthenticatedMember("/settings");
  redirect("/settings");
}
