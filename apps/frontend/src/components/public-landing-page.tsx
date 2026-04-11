import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";

const pillars = [
  {
    title: "清晰起步",
    body: "进入 workspace 后先从默认讨论间开始，再按需要创建工作房间、任务和 issue，不把演示数据混进真实协作。",
  },
  {
    title: "可控协作",
    body: "成员可以决定何时加入 agent、何时批准执行、何时推进合并与交付，让协作流程保持透明和可控。",
  },
  {
    title: "Agent 协作",
    body: "把 agent 加入 room 之后，就能在同一个上下文里接收讨论、参与任务，并保留完整的可观测信息。",
  },
];

export function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(173,216,255,0.22),transparent_34%),linear-gradient(180deg,#f4f7fb_0%,#edf1f6_100%)] px-4 py-6 text-black sm:px-5 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between gap-6 sm:min-h-[calc(100vh-4rem)] sm:gap-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:gap-5">
          <Card className="rounded-[24px] border border-white/70 bg-white/92 px-5 py-5 shadow-[0_24px_60px_rgba(31,35,41,0.08)] sm:rounded-[28px] sm:px-6 sm:py-6 md:px-8 md:py-8">
            <Eyebrow>OpenShock Swarm</Eyebrow>
            <h1 className="display-font mt-4 max-w-3xl text-[2.4rem] font-black uppercase leading-[0.95] tracking-[0.04em] text-black sm:text-5xl md:text-6xl">
              Human and agent work,
              <br />
              in one workspace.
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-6 text-black/68 sm:mt-5 sm:text-[15px] sm:leading-7">
              登录后即可进入同一个协作空间，创建讨论间、绑定工作仓库，并让消息、任务、运行与交付在统一上下文里推进。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-[16px] border border-[var(--accent-blue)] bg-[var(--accent-blue)] px-5 py-3 text-[16px] font-semibold tracking-[0.01em] text-white shadow-[0_10px_24px_rgba(59,107,255,0.22)] transition hover:translate-y-[-1px] sm:rounded-[18px] sm:px-6 sm:text-[18px]"
              >
                创建账号
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-[16px] border border-[var(--border)] bg-white px-5 py-3 text-[16px] font-semibold tracking-[0.01em] text-black/72 transition hover:bg-[var(--surface-muted)] sm:rounded-[18px] sm:px-6 sm:text-[18px]"
              >
                登录
              </Link>
            </div>
          </Card>

          <Card className="rounded-[24px] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,251,0.98))] px-5 py-5 sm:rounded-[28px]">
            <Eyebrow>你可以在这里完成</Eyebrow>
            <div className="mt-4 space-y-3">
              <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
                  Room 协作
                </div>
                <div className="mt-1 text-[14px] leading-6 text-black/74">
                  用默认讨论间快速开始，再为具体主题、任务或 issue 创建独立房间。
                </div>
              </div>
              <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
                  Workspace 绑定
                </div>
                <div className="mt-1 text-[14px] leading-6 text-black/74">
                  绑定默认仓库后，后续的 run、merge 和 delivery 会共享同一条执行链路。
                </div>
              </div>
              <div className="rounded-[16px] border border-[var(--border)] bg-white px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
                  人机协同
                </div>
                <div className="mt-1 text-[14px] leading-6 text-black/74">
                  成员和 agent 在同一 room 中协作，消息、状态和执行过程都能被持续追踪。
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {pillars.map((pillar) => (
            <Card
              key={pillar.title}
              className="rounded-[18px] border border-white/72 bg-white/86 px-4 py-4 sm:rounded-[22px] sm:px-5 sm:py-5"
            >
              <div className="display-font text-lg font-black uppercase tracking-[0.06em]">
                {pillar.title}
              </div>
              <p className="mt-3 text-[14px] leading-6 text-black/68">{pillar.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
