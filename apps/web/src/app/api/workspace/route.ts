import { NextResponse } from "next/server";

import { workspace } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(workspace);
}
