import { notFound } from "next/navigation";

import { OpenShockShell } from "@/components/open-shock-shell";
import { DetailRail, IssueDetailView } from "@/components/phase-zero-views";
import { getIssueByKey } from "@/lib/mock-data";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ issueKey: string }>;
}) {
  const { issueKey } = await params;
  const issue = getIssueByKey(issueKey);

  if (!issue) notFound();

  return (
    <OpenShockShell
      view="issues"
      eyebrow="Issue detail"
      title={issue.key}
      description={issue.summary}
      selectedRoomId={issue.roomId}
      contextTitle={issue.owner}
      contextDescription="The user-facing contract is still issue-driven, but the room becomes the place where humans and agents negotiate execution."
      contextBody={
        <DetailRail
          label="Issue links"
          items={[
            { label: "Room", value: issue.roomId },
            { label: "Run", value: issue.runId },
            { label: "PR", value: issue.pullRequest },
            { label: "Priority", value: issue.priority },
          ]}
        />
      }
    >
      <IssueDetailView issue={issue} />
    </OpenShockShell>
  );
}
