import { notFound } from "next/navigation";

import { OpenShockShell } from "@/components/open-shock-shell";
import { ChatFeed, DetailRail } from "@/components/phase-zero-views";
import { getChannelById, getMessagesForChannel } from "@/lib/mock-data";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;
  const channel = getChannelById(channelId);

  if (!channel) notFound();

  return (
    <OpenShockShell
      view="chat"
      eyebrow="Global chat shell"
      title={channel.name}
      description={channel.purpose}
      selectedChannelId={channel.id}
      contextTitle="Chat-first shell"
      contextDescription="Global channels stay informal. Once context needs ownership, runtime, or PR truth, it moves into an Issue Room."
      contextBody={
        <DetailRail
          label="Channel contract"
          items={[
            { label: "Purpose", value: channel.summary },
            { label: "Unread", value: String(channel.unread) },
            { label: "Graduates into", value: "Issue Room" },
            { label: "Internal object", value: "Session stays hidden" },
          ]}
        />
      }
    >
      <ChatFeed messages={getMessagesForChannel(channel.id)} />
    </OpenShockShell>
  );
}
