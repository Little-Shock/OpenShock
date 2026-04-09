import { OpenShockShell } from "@/components/open-shock-shell";
import { GitHubConnectionConsole } from "@/components/github-connection-console";
import { LiveBridgeConsole } from "@/components/live-bridge-console";
import { LiveSetupContextRail, LiveSetupOverview, OnboardingStudioPanel } from "@/components/live-setup-views";
import { RepoBindingConsole } from "@/components/repo-binding-console";
import { LiveRuntimeProvider } from "@/lib/live-runtime";

export default function SetupPage() {
  return (
    <LiveRuntimeProvider>
      <OpenShockShell
        view="setup"
        eyebrow="Onboarding Studio"
        title="把首次启动、GitHub 安装与 Runtime 真值收进同一条 Setup 主链"
        description="这里不再只摆静态步骤卡，而是直接显示 template bootstrap、repo binding、GitHub effective auth path、runtime bridge 与当前 resume progress。"
        contextTitle="首次启动在线"
        contextDescription="当模板选择、repo/GitHub/runtime 真值和 resumable progress 都直接从 live contract 读清时，Setup 才算真正站住。"
        contextBody={<LiveSetupContextRail />}
      >
        <div className="space-y-4">
          <LiveSetupOverview />
          <OnboardingStudioPanel />
          <RepoBindingConsole />
          <GitHubConnectionConsole />
          <LiveBridgeConsole />
        </div>
      </OpenShockShell>
    </LiveRuntimeProvider>
  );
}
