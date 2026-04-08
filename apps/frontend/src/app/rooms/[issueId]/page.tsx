import { ShellHomePage } from "@/components/shell-home-page";
import { getIssue } from "@/lib/api";

export const dynamic = "force-dynamic";

async function resolveRoomId(routeId: string) {
  if (routeId.startsWith("room_")) {
    return routeId;
  }

  if (routeId.startsWith("issue_")) {
    const issue = await getIssue(routeId);
    return issue.room.id;
  }

  return routeId;
}

export default async function IssueRoomPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const { issueId: routeId } = await params;
  const roomId = await resolveRoomId(routeId);
  return <ShellHomePage roomId={roomId} />;
}
