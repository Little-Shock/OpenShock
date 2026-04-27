import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const roomSourcePath = resolve(__dirname, "../components/stitch-chat-room-views.tsx");
const detailSourcePath = resolve(__dirname, "../components/live-detail-views.tsx");
const helpersSourcePath = resolve(__dirname, "phase-zero-helpers.ts");

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("room workbench no longer exposes topic as a top-level tab", () => {
  const roomSource = source(roomSourcePath);

  assert.doesNotMatch(roomSource, /type RoomWorkbenchTab = [^;]*"topic"/);
  assert.doesNotMatch(roomSource, /room-workbench-tab-topic/);
  assert.doesNotMatch(roomSource, /\["chat", "topic", "run", "pr", "context"\]/);
  assert.doesNotMatch(roomSource, /RoomTopicWorkbenchPanel/);
  assert.doesNotMatch(roomSource, /room-workbench-topic-panel/);
  assert.doesNotMatch(roomSource, /activeWorkbenchTab === "topic"/);
});

test("legacy room topic links collapse into the context surface", () => {
  const roomSource = source(roomSourcePath);
  const detailSource = source(detailSourcePath);
  const helpersSource = source(helpersSourcePath);

  assert.match(roomSource, /case "topic":\s*return "context";/);
  assert.doesNotMatch(detailSource, /\?tab=topic/);
  assert.match(helpersSource, /\?tab=topic[^]*return "讨论间上下文";/);
});

test("room workbench now exposes one primary next-step action instead of a summary-only overview card", () => {
  const roomSource = source(roomSourcePath);

  assert.match(roomSource, /buildRoomNextStep/);
  assert.match(roomSource, /buildRoomPendingOverview/);
  assert.match(roomSource, /buildRoomRelatedSignals/);
  assert.match(roomSource, /roomNextStep\.reason/);
  assert.match(roomSource, /<RoomContextPanels[^>]*nextStep=\{roomNextStep\}/);
  assert.match(roomSource, /<RoomWorkbenchRailSummary[^>]*nextStep=\{roomNextStep\}/);
  assert.doesNotMatch(roomSource, /function RoomContextPanels[\s\S]*const nextStep = buildRoomNextStep/);
  assert.doesNotMatch(roomSource, /function RoomWorkbenchRailSummary[\s\S]*const nextStep = buildRoomNextStep/);
  assert.match(roomSource, /data-testid="room-workbench-primary-next-link"/);
  assert.match(roomSource, /data-testid="room-rail-primary-next-link"/);
  assert.match(roomSource, /data-testid="room-header-primary-next-link"/);
  assert.doesNotMatch(roomSource, /先处理这批/);
  assert.doesNotMatch(roomSource, /主视图/);
});

test("room overview and pending panels avoid repeating signal and handoff counts above the real lists", () => {
  const roomSource = source(roomSourcePath);

  assert.doesNotMatch(roomSource, /信号<\/p>\s*<p className="mt-1\.5 text-sm font-semibold">\{relatedSignals\.length\} 条待处理<\/p>/);
  assert.doesNotMatch(roomSource, /交接箱<\/p>\s*<p className="mt-1\.5 text-sm font-semibold">\{relatedHandoffs\.length\} 条跟进中<\/p>/);
  assert.doesNotMatch(roomSource, /`优先看 \$\{previewSignals\.length\} 条`/);
  assert.doesNotMatch(roomSource, /`当前挂着 \$\{relatedHandoffs\.length\} 条`/);
  assert.doesNotMatch(roomSource, /收件箱 \{relatedSignals.length\} 条 · 交接 \{relatedHandoffs.length\} 条/);
  assert.doesNotMatch(roomSource, /\{relatedSignals\.length\} 条待处理 \/ \{recentSignals\.length\} 条最近/);
  assert.doesNotMatch(roomSource, /待处理信号<\/p>\s*<p className="mt-1\.5 text-sm font-semibold">\{relatedSignals\.length\} 条<\/p>/);
  assert.doesNotMatch(roomSource, /交接箱<\/p>\s*<p className="mt-1\.5 text-sm font-semibold">\{relatedHandoffs\.length\} 条<\/p>/);
});

test("room delivery and PR panels demote drill-in links behind the single primary action", () => {
  const roomSource = source(roomSourcePath);

  assert.match(roomSource, /data-testid="room-workbench-pr-primary-action"/);
  assert.match(roomSource, /data-testid="room-workbench-pr-action"/);
  assert.match(roomSource, /roomPullRequestActionStatusLabel\(pullRequestActionStatus\)/);
  assert.match(roomSource, /查看 PR 详情/);
  assert.match(roomSource, /查看远端 PR/);
  assert.match(roomSource, /去房间 PR/);
  assert.doesNotMatch(roomSource, /\{conversation\.length\} 条记录/);
  assert.match(roomSource, /已同步最新评论/);
  assert.match(roomSource, /data-testid="room-pr-detail-link"[\s\S]{0,220}className="underline/);
  assert.match(roomSource, /data-testid="room-workbench-pr-detail-link"[\s\S]{0,220}className="underline/);
});

test("room context and rail keep collaboration rules visible from session memory and routing policy", () => {
  const roomSource = source(roomSourcePath);

  assert.match(roomSource, /buildWorkspaceRuleHighlights/);
  assert.match(roomSource, /const roomRuleHighlights = room && run/);
  assert.match(roomSource, /ruleHighlights=\{roomRuleHighlights\}/);
  assert.match(roomSource, /testId="room-workbench-rule-panel"/);
  assert.match(roomSource, /testId="room-rail-rule-panel"/);
  assert.match(roomSource, /继续前先按这组规则/);
});

test("room thread fallback stays reachable on mobile when the desktop rail is hidden", () => {
  const roomSource = source(roomSourcePath);

  assert.match(roomSource, /data-testid="room-thread-mobile-panel"/);
  assert.match(roomSource, /testId: "room-thread-follow-current-mobile"/);
  assert.match(roomSource, /testId: "room-thread-close-mobile"/);
  assert.match(roomSource, /xl:hidden/);
});
