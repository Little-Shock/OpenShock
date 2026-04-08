import { getBootstrap, getTaskBoard } from "@/lib/api";
import type { Task } from "@/lib/types";
import { LiveRefresh } from "@/components/live-refresh";
import { ShellFrame } from "@/components/shell-frame";
import { TaskActionStrip } from "@/components/task-action-strip";
import { TaskQuickCreate } from "@/components/task-quick-create";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  ready_for_integration: "Ready for Integration",
  blocked: "Blocked",
  integrated: "Integrated",
  done: "Done",
};

function groupedTasks(tasks: Task[]) {
  return tasks.reduce<Record<string, Task[]>>((groups, task) => {
    const key = task.status in STATUS_LABELS ? task.status : "todo";
    groups[key] ??= [];
    groups[key].push(task);
    return groups;
  }, {});
}

function statusTone(status: string) {
  switch (status) {
    case "blocked":
      return "orange";
    case "ready_for_integration":
      return "purple";
    case "integrated":
    case "done":
      return "green";
    case "in_progress":
      return "blue";
    default:
      return "neutral";
  }
}

export async function TaskBoardPage() {
  const [bootstrap, board] = await Promise.all([getBootstrap(), getTaskBoard()]);
  const groups = groupedTasks(board.tasks);
  const realtimeScopes = [`workspace:${bootstrap.workspace.id}`, "board:default"];

  return (
    <ShellFrame
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      agents={bootstrap.agents}
      activeRoute="/board"
      title="Task Board"
      subtitle="Issue-level task breakdown across agents, mapped directly to execution lanes and integration readiness."
      rightRail={
        <div className="space-y-3.5 p-3.5">
          <Card className="rounded-[20px] px-3.5 py-3.5">
            <Eyebrow className="mb-2">Quick Create</Eyebrow>
            <TaskQuickCreate
              agents={bootstrap.agents}
              issueOptions={bootstrap.issueSummaries}
              defaultIssueId={bootstrap.defaultIssueId}
            />
          </Card>
        </div>
      }
    >
      <div className="space-y-3 p-4">
        <LiveRefresh scopes={realtimeScopes} />
        {board.columns.map((column) => {
          const tasks = groups[column] ?? [];

          return (
            <details
              key={column}
              open
              className="group overflow-hidden rounded-[18px] border border-[var(--border)] bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 marker:hidden">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-black/45 transition group-open:rotate-90">
                    ▸
                  </span>
                  <Badge tone={statusTone(column)}>{column.replaceAll("_", " ")}</Badge>
                </div>
                <Badge tone="blue-soft">{tasks.length}</Badge>
              </summary>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                      <th className="px-4 py-2.5">Task</th>
                      <th className="px-4 py-2.5">Issue</th>
                      <th className="px-4 py-2.5">Assignee</th>
                      <th className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-[13px] text-black/50"
                        >
                          No tasks in this status.
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-[var(--border)] align-top last:border-b-0"
                        >
                          <td className="px-4 py-3.5">
                            <div className="display-font text-[13px] font-black text-black/88">
                              {task.title}
                            </div>
                            {task.description ? (
                              <p className="mt-1 max-w-[34rem] text-[12px] leading-5 text-black/60">
                                {task.description}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge tone="dark">{task.issueId.replace("_", "#")}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-[12px] text-black/70">
                            {bootstrap.agents.find((agent) => agent.id === task.assigneeAgentId)?.name ??
                              task.assigneeAgentId}
                          </td>
                          <td className="px-4 py-3.5">
                            <TaskActionStrip
                              taskId={task.id}
                              issueId={task.issueId}
                              taskTitle={task.title}
                              compact
                              showContextHint={false}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </ShellFrame>
  );
}
