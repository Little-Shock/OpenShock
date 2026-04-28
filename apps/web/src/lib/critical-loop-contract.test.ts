import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { FRESH_FIRST_START_NEXT_ROUTE } from "./first-start-contract-fixtures.test-helper";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, "../../../../scripts/headed-critical-loop.mjs");
const roomsSourcePath = resolve(__dirname, "../components/live-detail-views.tsx");
const boardSourcePath = resolve(__dirname, "../components/stitch-board-inbox-views.tsx");
const roomSourcePath = resolve(__dirname, "../components/stitch-chat-room-views.tsx");
const onboardingSourcePath = resolve(__dirname, "../components/onboarding-wizard.tsx");
const settingsSourcePath = resolve(__dirname, "../components/live-settings-views.tsx");

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("critical loop contract keeps stable UI anchors for issue -> rooms continue -> room", () => {
  const roomsSource = source(roomsSourcePath);
  const boardSource = source(boardSourcePath);
  const roomSource = source(roomSourcePath);
  const onboardingSource = source(onboardingSourcePath);
  const settingsSource = source(settingsSourcePath);

  assert.match(roomsSource, /data-testid="rooms-continue-card"/);
  assert.match(roomsSource, /data-testid="rooms-continue-cta"/);
  assert.match(roomsSource, /data-testid=\{`room-snapshot-card-\$\{room\.id\}`\}/);

  assert.match(boardSource, /data-testid="board-create-issue-title"/);
  assert.match(boardSource, /data-testid="board-create-issue-summary"/);
  assert.match(boardSource, /data-testid="board-create-issue-submit"/);

  assert.match(roomSource, /data-testid="room-message-list"/);

  assert.match(onboardingSource, /data-testid="onboarding-account-submit"/);
  assert.match(onboardingSource, /data-testid=\{`onboarding-template-\$\{template\.id\}`\}/);
  assert.match(onboardingSource, /data-testid="onboarding-runtime-pair"/);
  assert.match(onboardingSource, /data-testid="onboarding-finish-submit"/);
  assert.match(settingsSource, /data-testid="settings-advanced-link"/);
  assert.match(settingsSource, /data-testid="settings-primary-link"/);
});

test("critical loop harness enforces fresh workspace onboarding to chat", () => {
  const scriptSource = source(scriptPath);

  assert.equal(FRESH_FIRST_START_NEXT_ROUTE, "/access");
  assert.match(scriptSource, /OPENSHOCK_BOOTSTRAP_MODE:\s*"fresh"/);
  assert.match(scriptSource, /OPENSHOCK_DAEMON_URL:\s*daemonURL/);
  assert.match(scriptSource, /freshStackMetadataPath/);
  assert.match(scriptSource, /readFile\(freshStackMetadataPath,\s*"utf8"\)/);
  assert.match(scriptSource, /OPENSHOCK_CONTROL_API_BASE:\s*serverURL/);
  assert.doesNotMatch(scriptSource, /NEXT_PUBLIC_OPENSHOCK_API_BASE:\s*serverURL/);
  assert.match(scriptSource, /fetchJSON\(`\$\{daemonURL\}\/v1\/runtime`\)/);
  assert.match(scriptSource, /runtime did not advertise a usable workspaceRoot/);
  assert.match(scriptSource, /rm\(runDir,\s*\{\s*recursive:\s*true,\s*force:\s*true\s*\}\)/);
  assert.match(scriptSource, /clickByTestId\(page, "home-primary-chat-cta"/);
  assert.match(scriptSource, /page\.url\(\)\.startsWith\(`\$\{webURL\}\/access`\)/);
  assert.match(scriptSource, /completeFreshAccessToSetup\(page, webURL\)/);
  assert.match(scriptSource, /access-ready-next-link/);
  assert.match(scriptSource, /assert\.equal\(readyHref, "\/setup"/);
  assert.doesNotMatch(scriptSource, /await page\.goto\(`\$\{webURL\}\/setup`/);
  assert.match(scriptSource, /onboarding-account-submit/);
  assert.match(scriptSource, /onboarding-template-dev-team/);
  assert.match(scriptSource, /onboarding-github-skip/);
  assert.match(scriptSource, /onboarding-repo-manual-submit/);
  assert.match(scriptSource, /onboarding-runtime-pair/);
  assert.match(scriptSource, /onboarding-agent-submit/);
  assert.match(scriptSource, /onboarding-finish-submit/);
  assert.match(scriptSource, /const finishOutcome = await waitFor/);
  assert.match(scriptSource, /if \(page\.url\(\)\.startsWith\(`\$\{webURL\}\/chat\/all`\)\)/);
  assert.match(scriptSource, /settings-advanced-link/);
  assert.match(scriptSource, /settings-primary-link/);
  assert.match(scriptSource, /\/settings\/advanced/);
  assert.match(scriptSource, /\/chat\/all/);
  assert.match(scriptSource, /channel-message-list/);
});

test("critical loop harness covers created object recovery through rooms continue and restart", () => {
  const scriptSource = source(scriptPath);

  assert.match(scriptSource, /board-create-issue-title/);
  assert.match(scriptSource, /board-create-issue-summary/);
  assert.match(scriptSource, /board-create-issue-submit/);
  assert.match(scriptSource, /rooms-continue-cta/);
  assert.match(scriptSource, /room-snapshot-card-\$\{targetRoomID\}/);
  assert.match(scriptSource, /fetchBrowserControlState\(page\)/);
  assert.match(scriptSource, /\/api\/control\/v1\/state/);
  assert.match(scriptSource, /waitForCreatedIssueState\(page, issueTitle, targetRoomID\)/);
  assert.match(scriptSource, /waitForPersistedIssueState\(/);
  assert.match(scriptSource, /stopProcess\(serverEntry\)/);
  assert.match(scriptSource, /server-restart/);
});

test("critical loop harness verifies a real settings action instead of route-only navigation", () => {
  const scriptSource = source(scriptPath);

  assert.match(scriptSource, /openSettingsDisclosure\(page, "workspace"/);
  assert.match(scriptSource, /openSettingsDisclosure\(page, "member"/);
  assert.match(scriptSource, /notification-email-target-input/);
  assert.match(scriptSource, /notification-save-email/);
  assert.match(scriptSource, /notification-action-message/);
});
