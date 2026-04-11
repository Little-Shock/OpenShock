import { redirect } from "next/navigation";
import { ShellHomePage } from "@/components/shell-home-page";
import { getIssue } from "@/lib/api";
import { requireAuthenticatedMember } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

async function resolveRoomId(routeId: string, sessionToken: string) {
  if (routeId.startsWith("room_")) {
    return routeId;
  }

  if (routeId.startsWith("issue_")) {
    try {
      const issue = await getIssue(routeId, { sessionToken });
      return issue.room.id;
    } catch {
      return "";
    }
  }

  return routeId;
}

export default async function IssueRoomPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId: routeId } = await params;
  const auth = await requireAuthenticatedMember(`/rooms/${routeId}`);
  const roomId = await resolveRoomId(routeId, auth.sessionToken);
  if (!roomId) {
    redirect("/");
  }
  return <ShellHomePage roomId={roomId} />;
}
