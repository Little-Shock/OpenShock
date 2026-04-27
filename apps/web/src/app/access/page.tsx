import { LiveAccessContextRail, LiveAccessOverview } from "@/components/live-access-views";
import { OpenShockShell } from "@/components/open-shock-shell";

export default function AccessPage() {
  return (
    <OpenShockShell
      view="access"
      eyebrow="账号"
      title="回到同一条工作对话"
      description="账号可用就回聊天；需要恢复时只补当前这一步。"
      contextTitle="还能继续吗"
      contextDescription="能进入就继续聊，缺一步就补一步。"
      contextBody={<LiveAccessContextRail />}
    >
      <LiveAccessOverview />
    </OpenShockShell>
  );
}
