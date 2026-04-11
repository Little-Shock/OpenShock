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
        eyebrow="Setup"
        title="把首次启动收成一条主链"
        description="这里直接镜像 next step、template bootstrap、repo / GitHub / runtime 真值和当前恢复入口，不再把 setup 做成一堆分散控制台。"
        contextTitle="Current Setup Truth"
        contextDescription="先回答现在该做什么，再展开 repo、GitHub、runtime 和 bridge 细节。"
        contextBody={<LiveSetupContextRail />}
      >
        <div className="space-y-4">
          <SetupFirstStartJourneyPanel />
          <LiveSetupOverview />
          <OnboardingStudioPanel />
          <RepoBindingConsole />
          <GitHubConnectionConsole />
          <LiveBridgeConsole />
          <BranchHeadTruthConsole />
          <LiveRolloutParityConsole />
        </div>
      </OpenShockShell>
    </LiveRuntimeProvider>
  );
}
