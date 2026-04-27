export class StateMutationError<TPayload = unknown> extends Error {
  payload: TPayload;
  status: number;

  constructor(message: string, status: number, payload: TPayload) {
    super(message);
    this.name = "StateMutationError";
    this.payload = payload;
    this.status = status;
  }
}

export function recoverStateMutationPayload<TPayload = unknown>(error: unknown) {
  if (error instanceof StateMutationError) {
    return error.payload as TPayload;
  }
  return null;
}

export function recoverCreateIssuePayload<TPayload extends { roomId?: string } = { roomId?: string }>(error: unknown) {
  const payload = recoverStateMutationPayload<TPayload>(error);
  if (payload?.roomId) {
    return payload;
  }
  return null;
}
