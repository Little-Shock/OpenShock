import { NextResponse } from "next/server";

import { sanitizeRunDetail } from "@/lib/phase-zero-helpers";
import type { RunDetail } from "@/lib/phase-zero-types";
import { readControlJSON } from "@/lib/server-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  try {
    const detail = sanitizeRunDetail(await readControlJSON<RunDetail>(`/v1/runs/${runId}/detail`));
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "run detail fetch failed";
    const status = message.includes("404") || message.includes("not found") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
