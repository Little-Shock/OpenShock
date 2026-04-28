import type { RuntimeRegistryRecord } from "@/lib/phase-zero-types";

type RuntimeOption = Pick<
  RuntimeRegistryRecord,
  "id" | "machine" | "daemonUrl" | "detectedCli" | "providers" | "state" | "workspaceRoot"
>;

function normalize(value: string | undefined) {
  return (value ?? "").trim();
}

export function onboardingRuntimeOptionValue(runtime: RuntimeOption | null | undefined) {
  return normalize(runtime?.machine) || normalize(runtime?.id);
}

export function onboardingRuntimeMatchesChoice(runtime: RuntimeOption | null | undefined, choice: string | undefined) {
  const trimmed = normalize(choice);
  if (!runtime || !trimmed) {
    return false;
  }
  return normalize(runtime.id) === trimmed || normalize(runtime.machine) === trimmed;
}

function runtimeReadinessScore(runtime: RuntimeOption) {
  let score = 0;
  if ((runtime.providers ?? []).length > 0) {
    score += 12;
  }
  if ((runtime.detectedCli ?? []).length > 0) {
    score += 6;
  }
  if (normalize(runtime.workspaceRoot)) {
    score += 4;
  }
  if (normalize(runtime.daemonUrl)) {
    score += 2;
  }

  switch (normalize(runtime.state)) {
    case "online":
    case "busy":
      score += 8;
      break;
    case "stale":
      score += 2;
      break;
    case "offline":
      score -= 8;
      break;
  }

  if ((runtime.providers ?? []).length === 0 && (runtime.detectedCli ?? []).length === 0 && !normalize(runtime.workspaceRoot)) {
    score -= 6;
  }

  return score;
}

export function buildOnboardingRuntimeOptions(runtimes: RuntimeRegistryRecord[]) {
  const base = runtimes.filter((runtime) => onboardingRuntimeOptionValue(runtime) || normalize(runtime.daemonUrl));
  const ranked = base
    .map((runtime, index) => ({ runtime, index, score: runtimeReadinessScore(runtime) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const ready = ranked.filter((item) => item.score > 0);
  const selected = ready.length > 0 ? ready : ranked;
  const seen = new Set<string>();
  const deduped: RuntimeRegistryRecord[] = [];

  for (const item of selected) {
    const key = onboardingRuntimeOptionValue(item.runtime).toLowerCase() || normalize(item.runtime.daemonUrl).toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item.runtime);
  }

  return deduped;
}

export function resolveOnboardingRuntimeChoice({
  currentChoice,
  selectedRuntimeName,
  runtimeOptions,
}: {
  currentChoice: string | undefined;
  selectedRuntimeName: string | undefined;
  runtimeOptions: RuntimeRegistryRecord[];
}) {
  if (runtimeOptions.some((runtime) => onboardingRuntimeMatchesChoice(runtime, currentChoice))) {
    return normalize(currentChoice);
  }
  if (runtimeOptions.some((runtime) => onboardingRuntimeMatchesChoice(runtime, selectedRuntimeName))) {
    return normalize(selectedRuntimeName);
  }
  return onboardingRuntimeOptionValue(runtimeOptions[0] ?? ({} as RuntimeRegistryRecord));
}

export function resolveOnboardingDaemonUrl({
  chosenRuntime,
  pairingDaemonUrl,
  selectedRuntimeName,
  fallback = "http://127.0.0.1:8090",
}: {
  chosenRuntime: RuntimeRegistryRecord | null;
  pairingDaemonUrl: string | undefined;
  selectedRuntimeName: string | undefined;
  fallback?: string;
}) {
  const chosenDaemonUrl = normalize(chosenRuntime?.daemonUrl);
  const pairedDaemonUrl = normalize(pairingDaemonUrl);
  if (chosenRuntime && !onboardingRuntimeMatchesChoice(chosenRuntime, selectedRuntimeName) && chosenDaemonUrl) {
    return chosenDaemonUrl;
  }
  return pairedDaemonUrl || chosenDaemonUrl || fallback;
}
