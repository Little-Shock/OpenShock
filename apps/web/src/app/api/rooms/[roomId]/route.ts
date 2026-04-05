import { NextResponse } from "next/server";

import { getIssueByRoomId, getMessagesForRoom, getRoomById, getRunById } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoomById(roomId);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({
    room,
    issue: getIssueByRoomId(roomId),
    run: getRunById(room.runId),
    messages: getMessagesForRoom(roomId),
  });
}
