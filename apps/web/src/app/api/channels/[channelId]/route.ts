import { NextResponse } from "next/server";

import { getChannelById, getMessagesForChannel } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const channel = getChannelById(channelId);

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...channel,
    messages: getMessagesForChannel(channelId),
  });
}
