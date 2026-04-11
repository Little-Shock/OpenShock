import { TaskBoardPage } from "@/components/task-board-page";
import { requireAuthenticatedMember } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  await requireAuthenticatedMember("/board");
  return <TaskBoardPage />;
}
