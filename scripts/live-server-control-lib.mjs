export function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function readInteger(value) {
  return Number.isInteger(value) ? value : 0;
}

export function normalizeURL(value) {
  return readString(value).replace(/\/+$/, "");
}

export function resolveControlAddress(explicitAddress, metadataAddress) {
  const requestedAddress = readString(explicitAddress);
  if (requestedAddress) {
    return requestedAddress;
  }
  const managedAddress = readString(metadataAddress);
  if (managedAddress) {
    return managedAddress;
  }
  return ":8080";
}

export function normalizeLiveServiceTruth(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  return {
    service: readString(payload.service),
    managed: Boolean(payload.managed),
    status: readString(payload.status),
    message: readString(payload.message),
    owner: readString(payload.owner),
    pid: readInteger(payload.pid),
    responderPID: readInteger(payload.responderPid),
    workspaceRoot: readString(payload.workspaceRoot),
    repoRoot: readString(payload.repoRoot),
    address: readString(payload.address),
    baseUrl: readString(payload.baseUrl),
    healthUrl: readString(payload.healthUrl),
    stateUrl: readString(payload.stateUrl),
    metadataPath: readString(payload.metadataPath),
    logPath: readString(payload.logPath),
    branch: readString(payload.branch),
    head: readString(payload.head),
    launchCommand: readString(payload.launchCommand),
    launchedAt: readString(payload.launchedAt),
    reloadedAt: readString(payload.reloadedAt),
    stoppedAt: readString(payload.stoppedAt),
    lastError: readString(payload.lastError),
    statusCommand: readString(payload.statusCommand),
    startCommand: readString(payload.startCommand),
    stopCommand: readString(payload.stopCommand),
    reloadCommand: readString(payload.reloadCommand),
  };
}

export function launchedProcessOwnsLiveService(payload, pid, expectedBaseUrl) {
  const truth = normalizeLiveServiceTruth(payload);
  if (!truth || !truth.managed) {
    return false;
  }
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  if (truth.responderPID !== pid) {
    return false;
  }
  const expected = normalizeURL(expectedBaseUrl);
  const actual = normalizeURL(truth.baseUrl || expectedBaseUrl);
  return !expected || actual === expected;
}
