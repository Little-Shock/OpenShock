"use client";

import Link from "next/link";

import { buildFirstStartJourney } from "@/lib/first-start-journey";
import { usePhaseZeroState } from "@/lib/live-phase0";

function statusLabel(ready: boolean, positive: string, negative: string) {
  return ready ? positive : negative;
}

function cardTone(kind: "primary" | "paper" | "ink") {
  if (kind === "primary") {
    return "border-[var(--shock-ink)] bg-[linear-gradient(135deg,#fff2a8_0%,#ffe36a_100%)] text-[var(--shock-ink)] shadow-[4px_4px_0_0_var(--shock-ink)]";
  }
  if (kind === "ink") {
    return "border-[var(--shock-ink)] bg-[var(--shock-ink)] text-[var(--shock-paper)] shadow-[4px_4px_0_0_rgba(24,20,14,0.26)]";
  }
  return "border-[rgba(24,20,14,0.16)] bg-white/88 text-[var(--shock-ink)] shadow-[0_18px_40px_rgba(24,20,14,0.1)]";
}

function actionButtonTone(kind: "primary" | "secondary") {
  if (kind === "primary") {
    return "bg-[var(--shock-ink)] text-[var(--shock-paper)]";
  }
  return "bg-white text-[var(--shock-ink)]";
}

export default function HomePage() {
  const { state, loading, error, refresh } = usePhaseZeroState();
  const journey = buildFirstStartJourney(state.workspace, state.auth.session);
  const actionableInbox = state.inbox.filter((item) => item.kind !== "status");
  const recentRoom = state.rooms.find((room) => room.unread > 0) ?? state.rooms[0];
  const liveRun = state.runs.find((run) => run.status === "running" || run.status === "blocked" || run.status === "paused") ?? state.runs[0];
  const workspaceReady = journey.onboardingDone;
  const runtimeReady = state.workspace.pairingStatus.trim() === "paired";
  const githubReady = Boolean(state.workspace.githubInstallation.connectionReady);
  const workspaceStatus = loading ? "正在确认" : statusLabel(workspaceReady, "可以直接开始", "还要先完成设置");
  const runtimeStatus = loading ? "正在确认" : statusLabel(runtimeReady, "已连接", "还没连上");
  const inboxStatus = loading ? "正在确认" : actionableInbox.length > 0 ? `${actionableInbox.length} 条待处理` : "暂时没有";

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(255,213,0,0.28),transparent_34%),linear-gradient(180deg,#fff8e7_0%,#fff6dd_100%)] px-5 py-6 text-[var(--shock-ink)] sm:px-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-[30px] border-2 border-[var(--shock-ink)] bg-[linear-gradient(135deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[6px_6px_0_0_var(--shock-ink)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[rgba(24,20,14,0.58)]">OpenShock</p>
              <h1 className="mt-3 font-display text-[2rem] font-bold leading-none sm:text-[3rem]">现在可以做什么</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgba(24,20,14,0.76)] sm:text-[15px]">
                先继续当前工作，再决定要不要看设置、回到讨论，或者处理待办交接。
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[30rem]">
              <div className="rounded-[18px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(24,20,14,0.54)]">工作区</p>
                <p className="mt-2 text-sm font-semibold">{workspaceStatus}</p>
              </div>
              <div className="rounded-[18px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(24,20,14,0.54)]">运行环境</p>
                <p className="mt-2 text-sm font-semibold">{runtimeStatus}</p>
              </div>
              <div className="rounded-[18px] border-2 border-[var(--shock-ink)] bg-white px-4 py-3 shadow-[3px_3px_0_0_var(--shock-ink)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(24,20,14,0.54)]">待办交接</p>
                <p className="mt-2 text-sm font-semibold">{inboxStatus}</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[26px] border-2 border-dashed border-[rgba(24,20,14,0.24)] bg-white/75 px-5 py-10 text-center shadow-[0_16px_36px_rgba(24,20,14,0.08)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(24,20,14,0.48)]">正在确认</p>
            <p className="mt-3 text-sm leading-6 text-[rgba(24,20,14,0.72)]">正在确认你可以从哪里继续。</p>
          </section>
        ) : error ? (
          <section className="rounded-[26px] border-2 border-[var(--shock-ink)] bg-white px-5 py-6 shadow-[4px_4px_0_0_var(--shock-ink)]">
            <p className="font-display text-2xl font-bold">暂时没连上工作区</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgba(24,20,14,0.76)]">
              先重试一次；如果还不行，就去设置页检查仓库、GitHub 和运行环境。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-full border-2 border-[var(--shock-ink)] bg-[var(--shock-ink)] px-4 py-2 text-sm font-semibold text-[var(--shock-paper)] shadow-[3px_3px_0_0_rgba(24,20,14,0.22)]"
                onClick={() => void refresh()}
                type="button"
              >
                再试一次
              </button>
              <Link
                className="rounded-full border-2 border-[var(--shock-ink)] bg-white px-4 py-2 text-sm font-semibold text-[var(--shock-ink)] shadow-[3px_3px_0_0_var(--shock-ink)]"
                href="/setup"
              >
                去检查设置
              </Link>
              <Link
                className="rounded-full border-2 border-[var(--shock-ink)] bg-white px-4 py-2 text-sm font-semibold text-[var(--shock-ink)] shadow-[3px_3px_0_0_var(--shock-ink)]"
                href="/access"
              >
                去账号页
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <article className={`rounded-[28px] border-2 p-5 sm:p-6 ${cardTone("primary")}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(24,20,14,0.62)]">下一步</p>
              <h2 className="mt-3 font-display text-[1.9rem] font-bold leading-none sm:text-[2.5rem]">{journey.nextLabel}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgba(24,20,14,0.84)] sm:text-[15px]">{journey.nextSummary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className={`rounded-full border-2 border-[var(--shock-ink)] px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_rgba(24,20,14,0.2)] ${actionButtonTone("primary")}`}
                  href={journey.nextHref}
                >
                  去{journey.nextSurfaceLabel}
                </Link>
                <Link
                  className={`rounded-full border-2 border-[var(--shock-ink)] px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_var(--shock-ink)] ${actionButtonTone("secondary")}`}
                  href={journey.launchHref}
                >
                  继续聊天
                </Link>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] border-2 border-[rgba(24,20,14,0.18)] bg-white/76 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(24,20,14,0.5)]">最近讨论</p>
                  <p className="mt-2 text-sm font-semibold">{recentRoom?.title || "还没有讨论间"}</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(24,20,14,0.72)]">
                    {recentRoom ? recentRoom.summary : "先在聊天或设置里起一个新任务。"}
                  </p>
                </div>
                <div className="rounded-[20px] border-2 border-[rgba(24,20,14,0.18)] bg-white/76 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(24,20,14,0.5)]">当前运行</p>
                  <p className="mt-2 text-sm font-semibold">{liveRun ? `${liveRun.status} · ${liveRun.owner}` : "没有进行中的运行"}</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(24,20,14,0.72)]">
                    {liveRun ? liveRun.nextAction : "需要时再从讨论间或任务板发起。"}
                  </p>
                </div>
                <div className="rounded-[20px] border-2 border-[rgba(24,20,14,0.18)] bg-white/76 px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(24,20,14,0.5)]">GitHub</p>
                  <p className="mt-2 text-sm font-semibold">{githubReady ? "可以继续走 PR" : "还没完全接好"}</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(24,20,14,0.72)]">
                    {githubReady ? "远端连接已就绪，可以继续评审和交付。" : "先在设置里把连接补齐，再继续远端链路。"}
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-4">
              <article className={`rounded-[26px] border-2 p-5 sm:p-6 ${cardTone("paper")}`}>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(24,20,14,0.5)]">现在最常用</p>
                <div className="mt-4 grid gap-3">
                  <Link className="rounded-[20px] border-2 border-[rgba(24,20,14,0.16)] bg-white px-4 py-4 shadow-[0_12px_24px_rgba(24,20,14,0.06)]" href={recentRoom ? `/rooms/${recentRoom.id}` : "/rooms"}>
                    <p className="text-sm font-semibold">回到最近讨论</p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(24,20,14,0.72)]">
                      {recentRoom ? `${recentRoom.title} · ${recentRoom.summary}` : "打开讨论间列表，继续当前任务。"}
                    </p>
                  </Link>
                  <Link className="rounded-[20px] border-2 border-[rgba(24,20,14,0.16)] bg-white px-4 py-4 shadow-[0_12px_24px_rgba(24,20,14,0.06)]" href={actionableInbox[0]?.href || "/mailbox"}>
                    <p className="text-sm font-semibold">处理待办交接</p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(24,20,14,0.72)]">
                      {actionableInbox.length > 0 ? actionableInbox[0]?.summary : "打开交接列表，看看有没有人等你接手。"}
                    </p>
                  </Link>
                  <Link className="rounded-[20px] border-2 border-[rgba(24,20,14,0.16)] bg-white px-4 py-4 shadow-[0_12px_24px_rgba(24,20,14,0.06)]" href="/setup">
                    <p className="text-sm font-semibold">检查设置</p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(24,20,14,0.72)]">
                      看仓库、GitHub 和运行环境是不是都在可用状态。
                    </p>
                  </Link>
                </div>
              </article>

              <article className={`rounded-[26px] border-2 p-5 sm:p-6 ${cardTone("ink")}`}>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(255,248,231,0.62)]">工作区概况</p>
                <p className="mt-3 text-lg font-semibold">{state.workspace.name || "当前工作区"}</p>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,248,231,0.84)]">
                  {state.workspace.repo ? `${state.workspace.repo} · ${state.workspace.branch || "当前分支"}` : "还没读到仓库信息。"}
                </p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(255,248,231,0.56)]">讨论间</dt>
                    <dd className="mt-1 text-sm font-semibold">{state.rooms.length} 个</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(255,248,231,0.56)]">运行</dt>
                    <dd className="mt-1 text-sm font-semibold">{state.runs.length} 条</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(255,248,231,0.56)]">交接</dt>
                    <dd className="mt-1 text-sm font-semibold">{state.mailbox.length} 条</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(255,248,231,0.56)]">消息</dt>
                    <dd className="mt-1 text-sm font-semibold">{state.workspace.usage?.messageCount ?? 0} 条 / {state.workspace.usage?.windowLabel || "当前窗口"}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
