import { NextResponse } from "next/server";

import { inboxItems } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(inboxItems);
}
