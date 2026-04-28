#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";
import { launchChromiumSession } from "./lib/playwright-chromium.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const freshStackMetadataPath = path.join(projectRoot, "data", "dev", "fresh-stack", "stack.json");
const args = parseArgs(process.argv.slice(2));
const artifactsRoot =
  process.env.OPENSHOCK_E2E_ARTIFACTS_DIR?.trim() ||
  (await mkdtemp(path.join(os.tmpdir(), "openshock-headed-critical-loop-")));
const artifactsDir = path.resolve(artifactsRoot);
const reportPath = args.reportPath ? path.resolve(projectRoot, args.reportPath) : path.join(artifactsDir, "report.md");
const runDir = path.join(artifactsDir, "run");
const logsDir = path.join(runDir, "logs");
const screenshotsDir = path.join(runDir, "screenshots");
const evidenceWorkspaceRoot = path.join(runDir, "workspace");
const statePath = path.join(runDir, "state.json");
const { url: daemonURL, source: daemonURLSource } = await resolveDaemonURL();

await rm(runDir, { recursive: true, force: true });
await mkdir(logsDir, { recursive: true });
await mkdir(screenshotsDir, { recursive: true });
await mkdir(evidenceWorkspaceRoot, { recursive: true });

const processes = [];
const screenshots = [];
const checkpoints = [];

function parseArgs(argv) {
  const result = { reportPath: "" };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--report") {
      result.reportPath = argv[index + 1] ?? "";
      index += 1;
    }
  }
  return result;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveViewport() {
  return {
    width: parsePositiveInteger(process.env.OPENSHOCK_E2E_VIEWPORT_WIDTH, 1280),
    height: parsePositiveInteger(process.env.OPENSHOCK_E2E_VIEWPORT_HEIGHT, 860),
  };
}

async function resolveDaemonURL() {
  const explicitURL = process.env.OPENSHOCK_DAEMON_URL?.trim();
  if (explicitURL) {
    return { url: explicitURL, source: "OPENSHOCK_DAEMON_URL" };
  }

  try {
    const payload = JSON.parse(await readFile(freshStackMetadataPath, "utf8"));
    const metadataURL = typeof payload?.urls?.daemon === "string" ? payload.urls.daemon.trim() : "";
    if (metadataURL) {
      return { url: metadataURL, source: path.relative(projectRoot, freshStackMetadataPath) };
    }
  } catch {
    // Fresh-stack metadata is optional; fall back to the default local daemon.
  }

  return { url: "http://127.0.0.1:8090", source: "default" };
}

function timestamp() {
  return new Date().toISOString();
}

function track(step) {
  checkpoints.push(`- ${step}`);
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("failed to allocate a local port"));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

function startProcess(name, command, commandArgs, options = {}) {
  const { cwd = projectRoot, env = process.env } = options;
  const logPath = path.join(logsDir, `${name}.log`);
  const logStream = createWriteStream(logPath, { flags: "a" });
  logStream.write(`[${timestamp()}] ${command} ${commandArgs.join(" ")}\n`);

  const child = spawn(command, commandArgs, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);
  child.on("exit", (code, signal) => {
    logStream.write(`\n[${timestamp()}] exited code=${code} signal=${signal}\n`);
    logStream.end();
  });

  const entry = { name, child, logPath };
  processes.push(entry);
  return entry;
}

async function stopProcess(entry) {
  const { child } = entry;
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    return;
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }
    await delay(250);
  }

  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    // process already exited
  }
}

async function cleanupProcesses() {
  await Promise.allSettled(processes.map((entry) => stopProcess(entry)));
}

async function waitFor(predicate, message, timeoutMs = 120_000, intervalMs = 500) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeoutMs) {
    try {
      const result = await predicate();
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }

  if (lastError instanceof Error) {
    throw new Error(`${message}\nlast error: ${lastError.message}`);
  }
  throw new Error(message);
}

async function waitForVisible(locator, message, timeoutMs = 120_000) {
  await waitFor(async () => (await locator.count()) > 0 && (await locator.first().isVisible()), message, timeoutMs);
}

async function fillByTestId(page, testId, value, message) {
  const locator = page.getByTestId(testId);
  await waitForVisible(locator, `${testId} did not render`);
  await waitFor(
    async () => {
      try {
        await locator.fill(value);
        return true;
      } catch (error) {
        if (error instanceof Error && /detached from the DOM|not visible|not editable/i.test(error.message)) {
          return false;
        }
        throw error;
      }
    },
    message
  );
}

async function clickByTestId(page, testId, message) {
  const locator = page.getByTestId(testId);
  await waitForVisible(locator, `${testId} did not render`);
  await waitFor(
    async () => {
      try {
        await locator.click();
        return true;
      } catch (error) {
        if (error instanceof Error && /detached from the DOM|not visible|not stable|not enabled/i.test(error.message)) {
          return false;
        }
        throw error;
      }
    },
    message
  );
}

async function clickWhenEnabledByTestId(page, testId, message, timeoutMs = 120_000) {
  const locator = page.getByTestId(testId);
  await waitFor(
    async () => {
      if ((await locator.count()) === 0 || !(await locator.first().isVisible()) || (await locator.first().isDisabled())) {
        return false;
      }
      await locator.first().click();
      return true;
    },
    message,
    timeoutMs
  );
}

async function openSettingsDisclosure(page, testID, message) {
  const toggle = page.getByTestId(`settings-advanced-${testID}-toggle`);
  await waitFor(async () => (await toggle.count()) > 0, message);
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await waitForVisible(page.getByTestId(`settings-advanced-${testID}-content`), `${testID} disclosure content did not render`);
}

async function capture(page, name) {
  const filePath = path.join(screenshotsDir, `${String(screenshots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  screenshots.push({ name, path: filePath });
}

async function fetchJSON(url, options = undefined) {
  const response = await fetch(url, { cache: "no-store", ...(options ?? {}) });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${options?.method ?? "GET"} ${url} -> ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function fetchBrowserControlState(page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/control/v1/state", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`GET /api/control/v1/state -> ${response.status}: ${JSON.stringify(payload)}`);
    }
    return payload;
  });
}

async function waitForCreatedIssueState(page, issueTitle, roomID) {
  return waitFor(
    async () => {
      const state = await fetchBrowserControlState(page);
      const issue = state.issues.find((item) => item.title === issueTitle);
      const room = state.rooms.find((item) => item.id === roomID);
      if (!issue || !room) {
        return false;
      }
      return { state, issue, room };
    },
    `created issue/room did not appear in authenticated /api/control/v1/state for room ${roomID}`
  );
}

async function waitForPersistedIssueState(page, issueID, roomID) {
  return waitFor(
    async () => {
      const state = await fetchBrowserControlState(page);
      const issue = state.issues.find((item) => item.id === issueID);
      const room = state.rooms.find((item) => item.id === roomID);
      if (!issue || !room) {
        return false;
      }
      return { state, issue, room };
    },
    `persisted issue/room did not appear in authenticated /api/control/v1/state for room ${roomID}`
  );
}

async function resolveServerWorkspaceRoot() {
  const runtimePayload = await fetchJSON(`${daemonURL}/v1/runtime`);
  const reportedWorkspaceRoot = typeof runtimePayload?.workspaceRoot === "string" ? runtimePayload.workspaceRoot.trim() : "";
  assert.ok(reportedWorkspaceRoot, "runtime did not advertise a usable workspaceRoot");
  return reportedWorkspaceRoot;
}

async function isVisible(locator) {
  try {
    return await locator.isVisible();
  } catch {
    return false;
  }
}

async function detectOnboardingStage(page, webURL) {
  if (page.url().startsWith(`${webURL}/chat/all`)) {
    return "chat";
  }
  if (await isVisible(page.getByTestId("onboarding-account-submit"))) {
    return "account";
  }
  if (await isVisible(page.getByTestId("onboarding-template-dev-team"))) {
    return "template";
  }
  if (await isVisible(page.getByTestId("onboarding-github-skip"))) {
    return "github";
  }
  if (await isVisible(page.getByTestId("onboarding-repo-manual-submit"))) {
    return "repo";
  }
  if (await isVisible(page.getByTestId("onboarding-runtime-pair"))) {
    return "runtime";
  }
  if (await isVisible(page.getByTestId("onboarding-agent-submit"))) {
    return "agent";
  }
  if (await isVisible(page.getByTestId("onboarding-finish-submit"))) {
    return "finish";
  }
  return "";
}

async function waitForOnboardingStage(page, webURL, previous = "") {
  try {
    return await waitFor(
      async () => {
        const stage = await detectOnboardingStage(page, webURL);
        if (!stage) {
          return false;
        }
        if (stage === "chat") {
          return stage;
        }
        if (previous && stage === previous) {
          return false;
        }
        return stage;
      },
      `onboarding did not advance to the next actionable stage from ${previous || "initial"}`
    );
  } catch (error) {
    const currentStage = await detectOnboardingStage(page, webURL);
    throw new Error(
      `onboarding did not advance to the next actionable stage from ${previous || "initial"}; current=${
        currentStage || "none"
      }; url=${page.url()}; ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function completeOnboardingToChat(page, webURL) {
  await waitForVisible(page.getByTestId("onboarding-overlay"), "onboarding overlay did not render");

  let stage = await waitForOnboardingStage(page, webURL);
  let guard = 0;

  while (stage !== "chat") {
    guard += 1;
    if (guard > 20) {
      throw new Error(`onboarding exceeded max transitions; last stage=${stage}`);
    }
    await capture(page, `onboarding-${String(guard).padStart(2, "0")}-${stage}`);

    if (stage === "account") {
      await fillByTestId(page, "onboarding-account-email", "owner@openshock.local", "account email never became editable");
      await fillByTestId(page, "onboarding-account-name", "Critical Loop Owner", "account name never became editable");
      await fillByTestId(page, "onboarding-account-device", "Critical Loop Browser", "account device never became editable");
      await clickByTestId(page, "onboarding-account-submit", "account submit action never became clickable");
      stage = await waitForOnboardingStage(page, webURL, stage);
      continue;
    }

    if (stage === "template") {
      await clickByTestId(page, "onboarding-template-dev-team", "template option never became clickable");
      stage = await waitForOnboardingStage(page, webURL, stage);
      continue;
    }

    if (stage === "github") {
      await waitFor(async () => !(await page.getByTestId("onboarding-github-skip").isDisabled()), "github skip never became enabled");
      await clickByTestId(page, "onboarding-github-skip", "github skip action never became clickable");
      stage = await waitForOnboardingStage(page, webURL, stage);
      continue;
    }

    if (stage === "repo") {
      await fillByTestId(page, "onboarding-repo-name", "Larkspur-Wang/OpenShock", "repo name never became editable");
      await fillByTestId(page, "onboarding-repo-url", "https://github.com/Larkspur-Wang/OpenShock", "repo url never became editable");
      await fillByTestId(page, "onboarding-repo-branch", "main", "repo branch never became editable");
      await clickByTestId(page, "onboarding-repo-manual-submit", "repo manual submit action never became clickable");
      stage = await waitForOnboardingStage(page, webURL, stage);
      continue;
    }

    if (stage === "runtime") {
      await waitFor(async () => !(await page.getByTestId("onboarding-runtime-pair").isDisabled()), "runtime pair action never became enabled");
      await clickByTestId(page, "onboarding-runtime-pair", "runtime pair action never became clickable");
      stage = await waitForOnboardingStage(page, webURL, stage);
      continue;
    }

    if (stage === "agent") {
      await clickByTestId(page, "onboarding-agent-submit", "agent submit action never became clickable");
      stage = await waitForOnboardingStage(page, webURL, stage);
      continue;
    }

    if (stage === "finish") {
      const finishOutcome = await waitFor(
        async () => {
          if (page.url().startsWith(`${webURL}/chat/all`)) {
            return "chat";
          }
          const finishButton = page.getByTestId("onboarding-finish-submit");
          if ((await finishButton.count()) > 0 && (await finishButton.isVisible()) && !(await finishButton.isDisabled())) {
            return "finish";
          }
          return false;
        },
        "finish stage never became actionable"
      );
      if (finishOutcome === "finish") {
        await clickByTestId(page, "onboarding-finish-submit", "finish action never became clickable");
      }
      await waitFor(() => page.url().startsWith(`${webURL}/chat/all`), `expected /chat/all after finish, got ${page.url()}`);
      stage = "chat";
      continue;
    }

    throw new Error(`unsupported onboarding stage: ${stage}`);
  }
}

async function clickIfEnabled(page, testId, message) {
  const locator = page.getByTestId(testId);
  await waitForVisible(locator, `${testId} did not render`);
  if (await locator.isDisabled()) {
    return false;
  }
  await clickWhenEnabledByTestId(page, testId, message, 10_000);
  return true;
}

async function completeFreshAccessToSetup(page, webURL) {
  await waitForVisible(page.getByTestId("access-login-submit"), "access login form did not render after home CTA");
  await fillByTestId(page, "access-login-email", "owner@openshock.local", "access login email never became editable");
  await fillByTestId(page, "access-login-name", "Critical Loop Owner", "access login name never became editable");
  await fillByTestId(page, "access-login-device-label", "Critical Loop Browser", "access login device never became editable");
  await clickByTestId(page, "access-login-submit", "access login action never became clickable");

  async function waitForAccessReadyOrRecovery(timeoutMs = 120_000) {
    return waitFor(
      async () => {
        if (await isVisible(page.getByTestId("access-ready-next-link"))) {
          return "ready";
        }
        if (await isVisible(page.getByTestId("access-recovery-status"))) {
          return "recovery";
        }
        const authError = page.getByTestId("access-auth-error");
        if ((await authError.count()) > 0 && (await authError.first().isVisible())) {
          throw new Error((await authError.first().textContent()) || "access login failed");
        }
        return false;
      },
      "access did not render a ready or recovery state after login",
      timeoutMs
    );
  }

  try {
    await waitForAccessReadyOrRecovery(20_000);
  } catch {
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForAccessReadyOrRecovery();
  }

  if (await isVisible(page.getByTestId("access-verify-email-submit"))) {
    await clickIfEnabled(page, "access-verify-email-submit", "access email verification action never became clickable");
  }
  const accessRecoveryOutcome = await waitFor(
    async () => {
      if (await isVisible(page.getByTestId("access-ready-next-link"))) {
        return "ready";
      }
      const authorizeButton = page.getByTestId("access-authorize-device-submit");
      if ((await authorizeButton.count()) > 0 && (await authorizeButton.isVisible()) && !(await authorizeButton.isDisabled())) {
        return "authorize";
      }
      return false;
    },
    "access recovery did not become ready for setup"
  );
  if (accessRecoveryOutcome === "authorize") {
    await clickWhenEnabledByTestId(page, "access-authorize-device-submit", "access device authorization action never became clickable");
  }

  const readyLink = page.getByTestId("access-ready-next-link");
  try {
    await waitForVisible(readyLink, "access ready next link did not render after identity recovery", 20_000);
  } catch (error) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForVisible(
      readyLink,
      `access ready next link did not render after identity recovery and reload: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const readyHref = await readyLink.getAttribute("href");
  assert.equal(readyHref, "/setup", "access ready next link should route to setup before onboarding is complete");
  await capture(page, "access-ready-for-setup");
  await clickByTestId(page, "access-ready-next-link", "access ready next link never became clickable");
  await waitFor(() => page.url().startsWith(`${webURL}/setup`), `access ready link did not route into setup, got ${page.url()}`);
}

async function startServices(serverPort, webPort) {
  const serverURL = `http://127.0.0.1:${serverPort}`;
  const webURL = `http://127.0.0.1:${webPort}`;
  const serverWorkspaceRoot = await resolveServerWorkspaceRoot();

  const serverEntry = startProcess("server", path.join(projectRoot, "scripts", "go.sh"), ["run", "./cmd/openshock-server"], {
    cwd: path.join(projectRoot, "apps", "server"),
    env: {
      ...process.env,
      OPENSHOCK_SERVER_ADDR: `127.0.0.1:${serverPort}`,
      OPENSHOCK_WORKSPACE_ROOT: serverWorkspaceRoot,
      OPENSHOCK_STATE_FILE: statePath,
      OPENSHOCK_DAEMON_URL: daemonURL,
      OPENSHOCK_BOOTSTRAP_MODE: "fresh",
    },
  });

  startProcess(
    "web",
    "pnpm",
    ["--dir", "apps/web", "exec", "next", "dev", "--hostname", "127.0.0.1", "--port", String(webPort)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        OPENSHOCK_CONTROL_API_BASE: serverURL,
      },
    }
  );

  await waitFor(async () => {
    const response = await fetch(`${serverURL}/healthz`);
    return response.ok;
  }, `server did not become healthy at ${serverURL}/healthz`);

  await waitFor(async () => {
    const response = await fetch(`${webURL}/`);
    return response.ok;
  }, `web did not become ready at ${webURL}/`);

  return { serverURL, webURL, serverEntry, serverWorkspaceRoot };
}

function resolveRoomIdFromURL(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/rooms\/([^/]+)$/);
  assert.ok(match?.[1], `expected room route /rooms/:roomId, got ${url}`);
  return decodeURIComponent(match[1]);
}

let browser = null;
let serverEntry = null;

try {
  const serverPort = await freePort();
  const webPort = await freePort();
  const { serverURL, webURL, serverEntry: startedServerEntry, serverWorkspaceRoot } = await startServices(serverPort, webPort);
  serverEntry = startedServerEntry;

  browser = await launchChromiumSession(chromium);
  const viewport = resolveViewport();
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto(`${webURL}/`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("home-primary-chat-cta"), "home page did not render primary chat CTA");
  await capture(page, "home-open-app");
  track("打开应用首页成功。");

  await clickByTestId(page, "home-primary-chat-cta", "home primary CTA never became clickable");
  await waitFor(() => page.url().startsWith(`${webURL}/access`), `home primary CTA did not route into access, got ${page.url()}`);
  track("首页主入口把 fresh workspace 先带入 `/access`。");
  await completeFreshAccessToSetup(page, webURL);
  await waitForVisible(page.getByTestId("onboarding-overlay"), "onboarding overlay did not render after home CTA");
  track("账号、邮箱和设备确认后进入 `/setup` 内的 guided setup。");

  await completeOnboardingToChat(page, webURL);
  await waitForVisible(page.getByTestId("channel-message-list"), "chat channel message list did not render");
  await waitForVisible(page.getByTestId("quick-search-trigger-topbar"), "chat shell topbar did not render");
  await capture(page, "chat-after-onboarding");
  track("完成 onboarding/setup 并进入 `/chat/all`。");

  const workspaceState = await fetchJSON(`${serverURL}/v1/workspace`);
  assert.equal(workspaceState.onboarding.status, "done", "workspace onboarding status should be done after onboarding flow");
  assert.equal(workspaceState.onboarding.resumeUrl, "/chat/all", "workspace onboarding resume URL should target /chat/all");

  await page.goto(`${webURL}/settings`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("settings-advanced-link"), "primary settings page did not render advanced link");
  await openSettingsDisclosure(page, "workspace", "primary settings page did not render workspace disclosure");
  await openSettingsDisclosure(page, "member", "primary settings page did not render member disclosure");
  await capture(page, "settings-primary");
  await clickByTestId(page, "settings-advanced-link", "advanced settings link never became clickable");
  await waitFor(() => page.url().startsWith(`${webURL}/settings/advanced`), `advanced settings route did not open, got ${page.url()}`);
  await waitForVisible(page.getByTestId("settings-primary-link"), "advanced settings page did not render return link");
  await waitForVisible(page.getByTestId("notification-save-email"), "advanced settings page did not render email save action");
  await fillByTestId(page, "notification-email-target-input", "ops+critical-loop@openshock.local", "notification email target never became editable");
  await clickByTestId(page, "notification-save-email", "notification email save action never became clickable");
  await waitFor(
    async () => ((await page.getByTestId("notification-action-message").textContent()) || "").includes("邮箱通知已保存"),
    "advanced settings email save did not produce a success message"
  );
  await capture(page, "settings-advanced");
  await clickByTestId(page, "settings-primary-link", "primary settings return link never became clickable");
  await waitFor(
    () => page.url().startsWith(`${webURL}/settings`) && !page.url().includes("/settings/advanced"),
    `primary settings route did not reopen, got ${page.url()}`
  );
  track("设置主页 disclosure 与高级页通知保存动作都能工作。");

  const issueTitle = `CRIT-LOOP ${Date.now()}`;
  const issueSummary = "验证 fresh workspace 单链路：setup -> chat -> issue -> rooms continue -> room reload persistence";
  await page.goto(`${webURL}/board`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("board-create-issue-title"), "board create issue title input did not render");
  await page.getByTestId("board-create-issue-title").fill(issueTitle);
  await page.getByTestId("board-create-issue-summary").fill(issueSummary);
  await page.getByTestId("board-create-issue-submit").click();
  await waitFor(() => page.url().includes("/rooms/"), `board issue creation did not navigate to room, got ${page.url()}`);
  const createdRoomURL = page.url();
  const targetRoomID = resolveRoomIdFromURL(createdRoomURL);
  await waitForVisible(page.getByTestId("room-message-list"), "newly created room did not render message list");
  await capture(page, "room-created-from-board");
  track(`从任务板创建 issue/room 成功，目标 room=${targetRoomID}。`);

  const { issue: createdIssue, room: createdRoom } = await waitForCreatedIssueState(page, issueTitle, targetRoomID);
  assert.equal(createdIssue.roomId, targetRoomID, "created issue roomId mismatch");

  await page.goto(`${webURL}/rooms`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("rooms-continue-card"), "rooms continue card did not render");
  await waitForVisible(page.getByTestId("rooms-continue-cta"), "rooms continue CTA did not render");
  await waitForVisible(page.getByTestId(`room-snapshot-card-${targetRoomID}`), `rooms snapshot did not render card for ${targetRoomID}`);
  const continueHref = await page.getByTestId("rooms-continue-cta").getAttribute("href");
  assert.equal(continueHref, `/rooms/${targetRoomID}`, "rooms continue target should point to the created room");
  await capture(page, "rooms-continue-for-created-room");
  track("`/rooms` continue 卡片命中刚创建的 room。");

  await page.getByTestId("rooms-continue-cta").click();
  await waitFor(() => page.url().includes(`/rooms/${targetRoomID}`), `continue CTA did not open target room ${targetRoomID}, got ${page.url()}`);
  await waitForVisible(page.getByTestId("room-message-list"), "target room message list missing after continue click");
  await capture(page, "room-entered-via-continue");
  track("通过 `/rooms` continue CTA 回到目标 room。");

  await page.goto(`${webURL}/rooms`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("rooms-continue-cta"), "rooms continue CTA missing before reload persistence check");
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("rooms-continue-cta"), "rooms continue CTA missing after reload");
  const continueHrefAfterReload = await page.getByTestId("rooms-continue-cta").getAttribute("href");
  assert.equal(
    continueHrefAfterReload,
    `/rooms/${targetRoomID}`,
    "rooms continue target changed after reload for created object"
  );
  await capture(page, "rooms-continue-after-reload");
  track("浏览器 reload 后 continue 目标仍指向同一 room。");

  const createdIssueID = createdIssue.id;
  const createdRoomTitle = createdRoom.title;
  await stopProcess(serverEntry);
  serverEntry = startProcess("server-restart", path.join(projectRoot, "scripts", "go.sh"), ["run", "./cmd/openshock-server"], {
    cwd: path.join(projectRoot, "apps", "server"),
    env: {
      ...process.env,
      OPENSHOCK_SERVER_ADDR: `127.0.0.1:${serverPort}`,
      OPENSHOCK_WORKSPACE_ROOT: serverWorkspaceRoot,
      OPENSHOCK_STATE_FILE: statePath,
      OPENSHOCK_DAEMON_URL: daemonURL,
      OPENSHOCK_BOOTSTRAP_MODE: "fresh",
    },
  });
  await waitFor(async () => {
    const response = await fetch(`${serverURL}/healthz`);
    return response.ok;
  }, `server restart did not become healthy at ${serverURL}/healthz`);

  await page.goto(`${webURL}/rooms`, { waitUntil: "domcontentloaded" });
  await waitForVisible(page.getByTestId("rooms-continue-cta"), "rooms continue CTA missing after server restart");
  const continueHrefAfterRestart = await page.getByTestId("rooms-continue-cta").getAttribute("href");
  assert.equal(
    continueHrefAfterRestart,
    `/rooms/${targetRoomID}`,
    "rooms continue target changed after server restart"
  );
  await page.getByTestId("rooms-continue-cta").click();
  await waitFor(() => page.url().includes(`/rooms/${targetRoomID}`), `continue CTA did not open target room after restart, got ${page.url()}`);
  await waitForVisible(page.getByTestId("room-message-list"), "target room message list missing after server restart");
  await capture(page, "room-after-server-restart");

  const { issue: issueAfterRestart, room: roomAfterRestart } = await waitForPersistedIssueState(
    page,
    createdIssueID,
    targetRoomID
  );
  assert.equal(issueAfterRestart.roomId, targetRoomID, "persisted issue room binding changed after restart");
  assert.equal(roomAfterRestart.title, createdRoomTitle, "persisted room title changed after restart");
  track("同一 state 文件重启 server 后，issue/room 对象仍可通过 `/rooms` continue 找回。");

  const report = [
    "# 2026-04-23 Fresh Workspace Critical Loop Report",
    "",
    `- Command: \`node ./scripts/headed-critical-loop.mjs --report ${path.relative(projectRoot, reportPath)}\``,
    `- Daemon URL: \`${daemonURL}\` (${daemonURLSource})`,
    `- Generated At: ${timestamp()}`,
    `- Artifacts Dir: \`${artifactsDir}\``,
    "",
    "## Checkpoints",
    ...checkpoints,
    "",
    "## Created Object",
    `- Issue ID: \`${createdIssueID}\``,
    `- Room ID: \`${targetRoomID}\``,
    `- Room URL: \`${createdRoomURL}\``,
    "",
    "## Screenshots",
    ...screenshots.map((item) => `- ${item.name}: ${item.path}`),
    "",
    "## Logs",
    ...processes.map((entry) => `- ${entry.name}: ${entry.logPath}`),
    "",
    "## Outcome",
    "- PASS: open app -> finish onboarding/setup -> enter chat -> create issue/room -> /rooms continue -> target room -> reload + server-restart persistence for same object.",
  ].join("\n");

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report}\n`, "utf8");
} finally {
  await Promise.allSettled([browser?.close(), cleanupProcesses()]);
}
