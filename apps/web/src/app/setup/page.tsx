"use client";

import { Suspense } from "react";

import { BranchHeadTruthConsole } from "@/components/branch-head-truth-console";
import { OpenShockShell } from "@/components/open-shock-shell";
import { GitHubConnectionConsole } from "@/components/github-connection-console";
import { LiveBridgeConsole } from "@/components/live-bridge-console";
import { LiveRolloutParityConsole } from "@/components/live-rollout-parity-console";
import { OnboardingExperience } from "@/components/onboarding-wizard";
import {
  LiveSetupContextRail,
  LiveSetupOverview,
  OnboardingStudioPanel,
  SetupFirstStartJourneyPanel,
} from "@/components/live-setup-views";
import { RepoBindingConsole } from "@/components/repo-binding-console";
import { buildFirstStartJourney } from "@/lib/first-start-journey";
import { usePhaseZeroState } from "@/lib/live-phase0";
import { LiveRuntimeProvider } from "@/lib/live-runtime";

function SetupWorkspaceSurface() {
  return (
    <OpenShockShell
      view="setup"
      eyebrow="开始使用"
      title="接通后就回到同一条工作对话"
      description="跟着下一步接通模板、仓库、GitHub 和运行环境；接好后直接回聊天继续工作。"
      contextTitle="现在还差哪一步"
      contextDescription="首屏只看当前缺口，其他支持信息按需展开。"
      contextBody={<LiveSetupContextRail />}
    >
      <div className="space-y-4">
        <SetupFirstStartJourneyPanel />
        <details
          data-testid="setup-overview-details"
          className="rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-paper)]"
        >
          <summary
            data-testid="setup-overview-toggle"
            className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.68)]"
          >
            展开当前状态概览
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            这里会显示仓库、运行环境、GitHub 和模板的整体状态。首屏先按上面的下一步继续。
          </p>
          <div className="mt-4">
            <LiveSetupOverview />
          </div>
        </details>
        <details
          id="setup-repo-section"
          data-testid="setup-repo-section"
          className="scroll-mt-6 rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-yellow)]"
        >
          <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.68)]">
            展开仓库与远端
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            只有需要重新绑定仓库、安装 GitHub 或排查连接时再展开。
          </p>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <RepoBindingConsole />
            <GitHubConnectionConsole />
          </div>
        </details>
        <details
          id="setup-runtime-section"
          data-testid="setup-runtime-section"
          className="scroll-mt-6 rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-pink)]"
        >
          <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.68)]">
            展开运行环境
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            日常使用只需要知道是否已连接；需要接入新机器或测试通道时再展开。
          </p>
          <div className="mt-4">
            <LiveBridgeConsole />
          </div>
        </details>
        <details
          id="setup-template-section"
          data-testid="setup-template-section"
          className="rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-paper)]"
        >
          <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.68)]">
            展开模板和启动包
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:rgba(24,20,14,0.72)]">
            只有需要改模板、频道或通知策略时再展开。
          </p>
          <div className="mt-4">
            <OnboardingStudioPanel />
          </div>
        </details>
        <details data-testid="setup-diagnostics-section" className="rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-lime)]">
          <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
            展开排障信息
          </summary>
          <div className="mt-4 space-y-4">
            <BranchHeadTruthConsole />
            <LiveRolloutParityConsole />
          </div>
        </details>
      </div>
    </OpenShockShell>
  );
}

function SetupExperience() {
  const { state, loading, error } = usePhaseZeroState();

  if (!loading && !error && !buildFirstStartJourney(state.workspace, state.auth.session).onboardingDone) {
    return (
      <Suspense fallback={null}>
        <OnboardingExperience />
      </Suspense>
    );
  }

  return <SetupWorkspaceSurface />;
}

export default function SetupPage() {
  return (
    <LiveRuntimeProvider>
      <SetupExperience />
    </LiveRuntimeProvider>
  );
}
