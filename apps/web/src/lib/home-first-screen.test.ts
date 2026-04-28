import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { FRESH_FIRST_START_NEXT_ROUTE } from "./first-start-contract-fixtures.test-helper";

const __dirname = dirname(fileURLToPath(import.meta.url));
const homeSourcePath = resolve(__dirname, "../app/page.tsx");

function homeSource() {
  return readFileSync(homeSourcePath, "utf8");
}

test("home first screen switches from first-start mode to shell-ready mode once the workspace is live", () => {
  const source = homeSource();

  assert.equal(FRESH_FIRST_START_NEXT_ROUTE, "/access");
  assert.match(source, /data-testid="home-primary-chat-cta"/);
  assert.match(source, /data-testid="home-first-start-next-route"/);
  assert.match(source, /data-testid="home-first-start-next-label"/);
  assert.match(source, /data-testid="home-first-start-launch-route"/);
  assert.match(source, /const needsOnboarding = !journey\.onboardingDone;/);
  assert.match(source, /const shellReady = !loading && !error && !needsOnboarding;/);
  assert.match(source, /const continueTarget = loading \|\| error \|\| needsOnboarding \? null : workspaceContinue\.target;/);
  assert.match(source, /const primaryEntryHref = needsOnboarding \? journey\.nextHref : chatHref;/);
  assert.match(source, /const primaryEntryLabel = needsOnboarding \? journey\.nextLabel : "进入聊天";/);
  assert.match(source, /const primaryContinueHref = continueTarget\?\.href \?\? primaryEntryHref;/);
  assert.match(source, /const primaryContinueLabel = continueTarget\?\.ctaLabel \?\? primaryEntryLabel;/);
  assert.match(source, /const primaryEntryReason = needsOnboarding \? journey\.nextSummary :/);
  assert.match(source, /data-testid="home-shell-surface"/);
  assert.match(source, /data-testid="home-shell-chat-link"/);
  assert.match(source, /data-testid="home-shell-dm-link"/);
  assert.match(source, /data-testid="home-shell-rooms-link"/);
  assert.match(source, /data-testid="home-shell-inbox-link"/);
  assert.match(source, /data-testid="home-shell-agents-link"/);
  assert.match(source, /data-testid="home-shell-machine-link"/);
  assert.match(source, /data-testid="home-shell-spawn-agent-link"/);
  assert.match(source, /派一个智能体开始处理/);
  assert.match(source, /频道 \/ 私聊/);
  assert.match(source, /待处理/);
  assert.match(source, /为什么先做这一步/);
  assert.match(source, /当前运行/);
  assert.match(source, /查看工作区状态/);
  assert.match(source, /data-testid="home-shell-status-details"/);
  assert.match(source, /data-testid="home-support-actions"/);
  assert.match(source, /data-testid="home-support-dm-link"/);
  assert.match(source, /data-testid="home-support-agents-link"/);
  assert.match(source, /data-testid="home-support-machine-link"/);
  assert.match(source, /shellReady \? null : \(/);
});
