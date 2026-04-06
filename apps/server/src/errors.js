export class CoordinatorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CoordinatorError";
    this.code = code;
    this.details = details;
  }
}

export function assertOrThrow(condition, code, message, details = {}) {
  if (!condition) {
    throw new CoordinatorError(code, message, details);
  }
}

