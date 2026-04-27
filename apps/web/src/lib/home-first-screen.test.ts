import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const homeSourcePath = resolve(__dirname, "../app/page.tsx");

function homeSource() {
  return readFileSync(homeSourcePath, "utf8");
}

test("home first screen switches from first-start mode to shell-ready mode once the workspace is live", () => {
  const source = homeSource();

  assert.match(source, /data-testid="home-primary-chat-cta"/);
  assert.match(source, /const needsOnboarding = !journey\.onboardingDone;/);
  assert.match(source, /const shellReady = !loading && !error && !needsOnboarding;/);
  assert.match(source, /const primaryEntryHref = needsOnboarding \? "\/setup" : chatHref;/);
  assert.match(source, /const primaryEntryLabel = needsOnboarding \? \(journey\.onboardingStarted \? "继续设置" : "开始设置"\) : "进入聊天";/);
  assert.match(source, /const primaryContinueHref = continueTarget\?\.href \?\? primaryEntryHref;/);
  assert.match(source, /const primaryContinueLabel = continueTarget\?\.ctaLabel \?\? primaryEntryLabel;/);
  assert.match(source, /data-testid="home-shell-surface"/);
  assert.match(source, /data-testid="home-shell-chat-link"/);
  assert.match(source, /data-testid="home-shell-dm-link"/);
  assert.match(source, /data-testid="home-shell-rooms-link"/);
  assert.match(source, /data-testid="home-shell-inbox-link"/);
  assert.match(source, /data-testid="home-shell-agents-link"/);
  assert.match(source, /data-testid="home-shell-machine-link"/);
  assert.match(source, /当前继续/);
  assert.match(source, /最近讨论/);
  assert.match(source, /当前运行/);
  assert.match(source, /查看当前状态与补充入口/);
  assert.match(source, /data-testid="home-status-strip"/);
  assert.match(source, /记忆会续上/);
  assert.match(source, /频道和私聊是一条对话/);
  assert.match(source, /你的电脑就是执行环境/);
  assert.match(source, /data-testid="home-support-actions"/);
  assert.match(source, /data-testid="home-support-dm-link"/);
  assert.match(source, /data-testid="home-support-agents-link"/);
  assert.match(source, /data-testid="home-support-machine-link"/);
  assert.match(source, /shellReady \? null : \(/);
});
