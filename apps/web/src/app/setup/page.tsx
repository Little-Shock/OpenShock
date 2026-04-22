import { BranchHeadTruthConsole } from "@/components/branch-head-truth-console";
import { OpenShockShell } from "@/components/open-shock-shell";
import { GitHubConnectionConsole } from "@/components/github-connection-console";
import { LiveBridgeConsole } from "@/components/live-bridge-console";
import { LiveRolloutParityConsole } from "@/components/live-rollout-parity-console";
import {
  LiveSetupContextRail,
  LiveSetupOverview,
  OnboardingStudioPanel,
  SetupFirstStartJourneyPanel,
} from "@/components/live-setup-views";
import { RepoBindingConsole } from "@/components/repo-binding-console";
import { LiveRuntimeProvider } from "@/lib/live-runtime";

export default function SetupPage() {
  return (
    <LiveRuntimeProvider>
      <OpenShockShell
        view="setup"
        eyebrow="开始使用"
        title="先把工作区接通"
        description="跟着下一步完成模板、仓库、GitHub 和运行环境，准备好后直接回到聊天。"
        contextTitle="当前是否可用"
        contextDescription="只看开始前必须确认的几项。"
        contextBody={<LiveSetupContextRail />}
      >
        <div className="space-y-4">
          <SetupFirstStartJourneyPanel />
          <LiveSetupOverview />
          <OnboardingStudioPanel />
          <details data-testid="setup-repo-section" className="rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-yellow)]">
            <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
              展开仓库与远端
            </summary>
            <div className="mt-4 space-y-4">
              <RepoBindingConsole />
              <GitHubConnectionConsole />
            </div>
          </details>
          <details data-testid="setup-runtime-section" className="rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-pink)]">
            <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
              展开运行环境
            </summary>
            <div className="mt-4 space-y-4">
              <LiveBridgeConsole />
            </div>
          </details>
          <details data-testid="setup-diagnostics-section" className="rounded-[28px] border-2 border-[var(--shock-ink)] bg-white px-5 py-4 shadow-[6px_6px_0_0_var(--shock-lime)]">
            <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-[color:rgba(24,20,14,0.62)]">
              展开诊断对账
            </summary>
            <div className="mt-4 space-y-4">
              <BranchHeadTruthConsole />
              <LiveRolloutParityConsole />
            </div>
          </details>
        </div>
      </OpenShockShell>
    </LiveRuntimeProvider>
  );
}
