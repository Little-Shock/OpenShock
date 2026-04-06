import crypto from "node:crypto";

export function nowIso() {
  return new Date().toISOString();
}

export function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function deepMerge(base, patch) {
  if (Array.isArray(base) || Array.isArray(patch)) {
    return deepClone(patch);
  }
  if (
    base === null ||
    patch === null ||
    typeof base !== "object" ||
    typeof patch !== "object"
  ) {
    return deepClone(patch);
  }
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = deepMerge(base[key] ?? {}, value);
      continue;
    }
    out[key] = deepClone(value);
  }
  return out;
}

