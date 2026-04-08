"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getRealtimeEventsUrl } from "@/lib/api";

type LiveRefreshProps = {
  scopes?: string[];
  refreshDelayMs?: number;
};

export function LiveRefresh({
  scopes = ["workspace:ws_01"],
  refreshDelayMs = 600,
}: LiveRefreshProps) {
  const router = useRouter();
  const refreshTimerRef = useRef<number | null>(null);
  const streamUrl = getRealtimeEventsUrl(scopes);

  useEffect(() => {
    const source = new EventSource(streamUrl);

    const flushRefresh = () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      startTransition(() => {
        router.refresh();
      });
    };

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) {
        return;
      }
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        startTransition(() => {
          router.refresh();
        });
      }, refreshDelayMs);
    };

    source.addEventListener("update", scheduleRefresh);
    source.addEventListener("resync_required", flushRefresh);
    source.onerror = () => {
      scheduleRefresh();
    };

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      source.close();
    };
  }, [refreshDelayMs, router, streamUrl]);

  return null;
}
