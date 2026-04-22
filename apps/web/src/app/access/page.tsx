import { LiveAccessContextRail, LiveAccessOverview } from "@/components/live-access-views";
import { OpenShockShell } from "@/components/open-shock-shell";

export default function AccessPage() {
  return (
    <OpenShockShell
      view="access"
      eyebrow="账号"
      title="确认你能进入工作区"
      description="先确认账号、邮箱和设备；成员切换和恢复操作按需展开。"
      contextTitle="能不能继续"
      contextDescription="账号可用就回到聊天，缺一步就按提示补齐。"
      contextBody={<LiveAccessContextRail />}
    >
      <LiveAccessOverview />
    </OpenShockShell>
  );
}
