import type { WorkspaceGovernanceSnapshot } from "./phase-zero-types";

export type WorkspaceRuleHighlight = {
  id: string;
  source: "route" | "file";
  badge: string;
  label: string;
  summary: string;
};

function normalizePath(path: string) {
  return path.trim().replace(/\\/g, "/");
}

function memoryPathLabel(path: string) {
  switch (path) {
    case "MEMORY.md":
      return "工作区记忆";
    case "notes/channels.md":
      return "频道规则";
    case "notes/operating-rules.md":
      return "执行规则";
    case "notes/skills.md":
      return "技能规则";
    case "notes/work-log.md":
      return "工作记录";
    default:
      if (path.startsWith("notes/rooms/")) {
        return "房间笔记";
      }
      if (path.startsWith("decisions/")) {
        return "决策记录";
      }
      return path;
  }
}

function memoryPathSummary(path: string) {
  switch (path) {
    case "MEMORY.md":
      return "继续前会先读这份工作区记忆。";
    case "notes/channels.md":
      return "继续前会先对齐频道约定。";
    case "notes/operating-rules.md":
      return "继续前会先对齐执行规则。";
    case "notes/skills.md":
      return "继续前会先对齐共用技能做法。";
    case "notes/work-log.md":
      return "继续前会先看最近工作记录。";
    default:
      if (path.startsWith("notes/rooms/")) {
        return "继续前会先看这间讨论的房间笔记。";
      }
      if (path.startsWith("decisions/")) {
        return "继续前会先看已有决策记录。";
      }
      return `继续前会先读 ${path}。`;
  }
}

export function buildWorkspaceRuleHighlights(
  governance: WorkspaceGovernanceSnapshot | undefined,
  memoryPaths: string[],
  limit = 4
): WorkspaceRuleHighlight[] {
  const routeHighlights = (governance?.routingPolicy?.rules ?? [])
    .filter((rule) => Boolean(rule?.summary?.trim() || rule?.policy?.trim()))
    .slice(0, 2)
    .map((rule, index) => ({
      id: `route-${rule.id || index}`,
      source: "route" as const,
      badge: "协作",
      label: `${rule.fromLane} -> ${rule.toLane}`,
      summary: rule.summary || rule.policy,
    }));

  const seenPaths = new Set<string>();
  const fileHighlights = memoryPaths
    .map((path) => normalizePath(path))
    .filter((path) => {
      if (!path || seenPaths.has(path)) {
        return false;
      }
      seenPaths.add(path);
      return true;
    })
    .slice(0, Math.max(limit-routeHighlights.length, 0))
    .map((path) => ({
      id: `file-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`,
      source: "file" as const,
      badge: "文件",
      label: memoryPathLabel(path),
      summary: `${memoryPathSummary(path)} ${path}`,
    }));

  return [...routeHighlights, ...fileHighlights].slice(0, limit);
}
