import { getBootstrap, getTaskBoard } from "@/lib/api";
import { TaskCreateDialog } from "@/components/task-create-dialog";
import type { Task } from "@/lib/types";
import { LiveRefresh } from "@/components/live-refresh";
import { ShellFrame } from "@/components/shell-frame";
import { TaskActionStrip } from "@/components/task-action-strip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { InfoHint } from "@/components/ui/info-hint";
import { getCurrentSessionToken } from "@/lib/operator-server";

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

function MobileTaskCard({
  task,
  agentName,
}: {
  task: Task;
  agentName: string;
}) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="display-font text-[13px] font-black text-black/88">
            {task.title}
          </div>
          <div className="mt-1 text-[11px] text-black/55">
            {task.issueId.replace("_", "#")} · {agentName}
          </div>
        </div>
        <Badge tone="dark">{task.id.replace("_", "#")}</Badge>
      </div>
      {task.description ? (
        <p className="mt-2 text-[12px] leading-5 text-black/60">{task.description}</p>
      ) : null}
      <div className="mt-3">
        <TaskActionStrip
          taskId={task.id}
          issueId={task.issueId}
          taskTitle={task.title}
          compact
          showContextHint={false}
        />
      </div>
    </div>
  );
}

export async function TaskBoardPage() {
  const sessionToken = await getCurrentSessionToken();
  const [bootstrap, board] = await Promise.all([
    getBootstrap({ sessionToken }),
    getTaskBoard({ sessionToken }),
  ]);
  const groups = groupedTasks(board.tasks);
  const realtimeScopes = [`workspace:${bootstrap.workspace.id}`, "board:default"];
  const blockedCount = groups.blocked?.length ?? 0;
  const readyCount = groups.ready_for_integration?.length ?? 0;
  const inProgressCount = groups.in_progress?.length ?? 0;
  const activeIssueCount = new Set(board.tasks.map((task) => task.issueId)).size;

  return (
    <ShellFrame
      workspaceId={bootstrap.workspace.id}
      workspaceName={bootstrap.workspace.name}
      rooms={bootstrap.rooms}
      directRooms={bootstrap.directRooms}
      alignedTopRows
      footerPanel={null}
      rightRailWidthClass="md:grid-cols-[minmax(0,1fr)_360px]"
      activeRoute="/board"
      title="Task Board"
      headerMeta={
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Badge tone="blue-soft">Execution Board</Badge>
          <span className="shrink-0 text-[12px] font-medium text-black/58">
            {board.tasks.length} tasks
          </span>
          <span className="shrink-0 text-[12px] font-medium text-black/52">
            {activeIssueCount} active issues
          </span>
          <span className="truncate text-[13px] font-medium text-black/58">
            Track task state by execution lane and move work toward integration.
          </span>
        </div>
      }
      rightRail={
        <div className="space-y-3.5 p-3.5">
          <Card className="rounded-[12px] px-3 py-2.5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Eyebrow>Task Actions</Eyebrow>
              <Badge tone="blue-soft">{bootstrap.issueSummaries.length} issues</Badge>
            </div>
            <div className="space-y-3">
              <div className="rounded-[16px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(247,248,250,0.96),rgba(255,255,255,0.98))] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="action-card-title">Cross-issue create</div>
                      <InfoHint label="从任务板直接选择 issue，在弹窗里创建并分配新任务。" />
                    </div>
                  </div>
                  <TaskCreateDialog
                    agents={bootstrap.agents}
                    issueOptions={bootstrap.issueSummaries}
                    defaultIssueId={bootstrap.defaultIssueId}
                    buttonLabel="New Task"
                    buttonVariant="primary"
                    buttonSize="sm"
                  />
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                    <div className="action-card-label">In progress</div>
                    <div className="action-card-value mt-1">
                      {inProgressCount}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                    <div className="action-card-label">Ready to merge</div>
                    <div className="action-card-value mt-1">
                      {readyCount}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                    <div className="action-card-label">Blocked</div>
                    <div className="action-card-value mt-1">
                      {blockedCount}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-[var(--border)] bg-white px-3 py-2.5">
                    <div className="action-card-label">Active issues</div>
                    <div className="action-card-value mt-1">
                      {activeIssueCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <div className="space-y-3 px-3 py-3">
        <LiveRefresh scopes={realtimeScopes} />
        <div className="mx-auto w-full max-w-5xl space-y-2.5">
          {board.columns.map((column) => {
            const tasks = groups[column] ?? [];

            return (
              <details
                key={column}
                open
                className="group overflow-hidden rounded-[12px] border border-[var(--border)] bg-white shadow-[0_4px_12px_rgba(31,35,41,0.04)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 marker:hidden">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-black/45 transition group-open:rotate-90">
                      ▸
                    </span>
                    <Badge tone={statusTone(column)}>
                      {STATUS_LABELS[column] ?? column.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <Badge tone="blue-soft">{tasks.length}</Badge>
                </summary>
                <div className="overflow-x-auto">
                  <div className="space-y-2 p-3 md:hidden">
                    {tasks.length === 0 ? (
                      <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-white px-3 py-4 text-[13px] text-black/50">
                        No tasks in this status.
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <MobileTaskCard
                          key={task.id}
                          task={task}
                          agentName={
                            bootstrap.agents.find((agent) => agent.id === task.assigneeAgentId)?.name ??
                            task.assigneeAgentId
                          }
                        />
                      ))
                    )}
                  </div>
                  <table className="hidden min-w-full border-collapse md:table">
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
      </div>
    </ShellFrame>
  );
}
