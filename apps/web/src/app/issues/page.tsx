import { OpenShockShell } from "@/components/open-shock-shell";
import { LiveIssuesListView } from "@/components/live-detail-views";
import { DetailRail } from "@/components/phase-zero-views";

export default function IssuesPage() {
  return (
    <OpenShockShell
      view="issues"
      eyebrow="事项"
      title="选择要推进的事项"
      description="先看当前事项，再进入对应讨论间或执行记录。"
      contextTitle="下一步去哪里"
      contextDescription="事项连着讨论间和执行记录，打开后即可继续处理。"
      contextBody={
        <DetailRail
          label="事项路径"
          items={[
            { label: "事项 -> 讨论间", value: "1:1" },
            { label: "讨论间 -> 话题", value: "1:1" },
            { label: "运行记录", value: "按房间关联" },
            { label: "PR 关联", value: "按房间关联" },
          ]}
        />
      }
    >
      <LiveIssuesListView />
    </OpenShockShell>
  );
}
