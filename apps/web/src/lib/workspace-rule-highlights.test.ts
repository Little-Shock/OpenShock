import assert from "node:assert/strict";
import test from "node:test";

import type { WorkspaceGovernanceSnapshot } from "./phase-zero-types";

const { buildWorkspaceRuleHighlights } = (await import(
  new URL("./workspace-rule-highlights.ts", import.meta.url).href
)) as typeof import("./workspace-rule-highlights");

function buildGovernance(): WorkspaceGovernanceSnapshot {
  return {
    templateId: "dev-team",
    label: "开发团队协作流",
    summary: "",
    deliveryDelegationMode: "formal-handoff",
    teamTopology: [],
    handoffRules: [],
    routingPolicy: {
      status: "ready",
      summary: "",
      defaultRoute: "/rooms",
      rules: [
        {
          id: "blocked-to-owner",
          trigger: "blocked",
          fromLane: "开发",
          toLane: "负责人",
          policy: "blocked 直接升级",
          summary: "阻塞时直接交回负责人确认下一步。",
          status: "ready",
        },
      ],
      suggestedHandoff: {
        status: "ready",
        reason: "",
      },
    },
    escalationSla: {
      status: "ready",
      summary: "",
      timeoutMinutes: 20,
      retryBudget: 2,
      activeEscalations: 0,
      breachedEscalations: 0,
      nextEscalation: "",
    },
    notificationPolicy: {
      status: "ready",
      summary: "",
      browserPush: "",
      targets: [],
      escalationChannel: "",
    },
    responseAggregation: {
      status: "ready",
      summary: "",
      sources: [],
      finalResponse: "",
      aggregator: "",
      decisionPath: [],
      overrideTrace: [],
      auditTrail: [],
    },
    humanOverride: {
      status: "idle",
      summary: "",
      href: "",
    },
    walkthrough: [],
    stats: {
      openHandoffs: 0,
      blockedEscalations: 0,
      reviewGates: 0,
      humanOverrideGates: 0,
      slaBreaches: 0,
      aggregationSources: 0,
    },
  };
}

test("buildWorkspaceRuleHighlights merges routing rules with file rules", () => {
  const highlights = buildWorkspaceRuleHighlights(buildGovernance(), [
    "MEMORY.md",
    "notes/operating-rules.md",
    "notes/skills.md",
  ]);

  assert.equal(highlights[0]?.source, "route");
  assert.match(highlights[0]?.label ?? "", /开发 -> 负责人/);
  assert.equal(highlights[1]?.source, "file");
  assert.equal(highlights[1]?.label, "工作区记忆");
  assert.equal(highlights[2]?.label, "执行规则");
});

test("buildWorkspaceRuleHighlights deduplicates memory paths and keeps readable summaries", () => {
  const highlights = buildWorkspaceRuleHighlights(undefined, [
    "notes/channels.md",
    "notes/channels.md",
    "notes/rooms/room-memory.md",
  ]);

  assert.equal(highlights.length, 2);
  assert.equal(highlights[0]?.label, "频道规则");
  assert.match(highlights[0]?.summary ?? "", /notes\/channels\.md/);
  assert.equal(highlights[1]?.label, "房间笔记");
});
