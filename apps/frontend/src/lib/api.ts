import type {
  ActionRequest,
  BootstrapResponse,
  InboxResponse,
  IssueDetailResponse,
  RoomDetailResponse,
  TaskBoardResponse,
} from "@/lib/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizeRoomDetailResponse(room: RoomDetailResponse): RoomDetailResponse {
  return {
    ...room,
    workspace: {
      ...room.workspace,
      repoBindings: room.workspace?.repoBindings ?? [],
    },
    messages: room.messages ?? [],
    agentSessions: room.agentSessions ?? [],
    agentTurns: room.agentTurns ?? [],
    agentWaits: room.agentWaits ?? [],
    handoffRecords: room.handoffRecords ?? [],
    tasks: room.tasks ?? [],
    runs: room.runs ?? [],
    runOutputChunks: room.runOutputChunks ?? [],
    toolCalls: room.toolCalls ?? [],
    mergeAttempts: room.mergeAttempts ?? [],
  };
}

export function getBootstrap() {
  return request<BootstrapResponse>("/api/v1/bootstrap").then((bootstrap) => ({
    ...bootstrap,
    workspace: {
      ...bootstrap.workspace,
      repoBindings: bootstrap.workspace?.repoBindings ?? [],
    },
  }));
}

export function getIssue(issueId: string) {
  return request<IssueDetailResponse>(`/api/v1/issues/${issueId}`).then((detail) => ({
    ...detail,
    workspace: {
      ...detail.workspace,
      repoBindings: detail.workspace?.repoBindings ?? [],
    },
  }));
}

export function getRoom(roomId: string) {
  return request<RoomDetailResponse>(`/api/v1/rooms/${roomId}`).then(normalizeRoomDetailResponse);
}

export function getTaskBoard() {
  return request<TaskBoardResponse>("/api/v1/task-board");
}

export function getInbox() {
  return request<InboxResponse>("/api/v1/inbox");
}

export function submitAction(payload: ActionRequest) {
  return request("/api/v1/actions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getRealtimeEventsUrl(scopes: string[] = []) {
  const params = new URLSearchParams();

  for (const scope of scopes) {
    const value = scope.trim();
    if (value) {
      params.append("scope", value);
    }
  }

  const query = params.toString();
  return `${API_BASE_URL}/api/v1/realtime/events${query ? `?${query}` : ""}`;
}
