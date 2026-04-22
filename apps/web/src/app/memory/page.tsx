import { OpenShockShell } from "@/components/open-shock-shell";
import {
  LiveMemoryContextRail,
  LiveMemoryView,
} from "@/components/live-memory-views";

export default function MemoryPage() {
  return (
    <OpenShockShell
      view="memory"
      eyebrow="记忆"
      title="决定下次带哪些资料"
      description="查看资料来源、版本和可用范围，清掉不该进入下一次任务的内容。"
      contextTitle="会带上什么"
      contextDescription="先看来源、范围和最近变更，再决定是否调整。"
      contextBody={<LiveMemoryContextRail />}
    >
      <LiveMemoryView />
    </OpenShockShell>
  );
}
