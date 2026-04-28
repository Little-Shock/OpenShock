#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { accessSync, constants as fsConstants, createWriteStream } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";
import { resolveProvidedServiceTargets } from "./lib/headed-service-targets.mjs";
import { launchChromiumSession } from "./lib/playwright-chromium.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const evidenceRoot =
  process.env.OPENSHOCK_E2E_ARTIFACTS_DIR?.trim() ||
  (await mkdtemp(path.join(os.tmpdir(), "openshock-rooms-continue-")));
const artifactsDir = path.resolve(evidenceRoot);
const parsedArgs = parseArgs(process.argv.slice(2));
const providedServiceTargets = resolveProvidedServiceTargets(process.argv.slice(2));
const reportPath = parsedArgs.reportPath
  ? path.resolve(projectRoot, parsedArgs.reportPath)
  : path.join(artifactsDir, "report.md");
const screenshotsDir = path.join(artifactsDir, "screenshots");
const logsDir = path.join(artifactsDir, "logs");

await mkdir(screenshotsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });

const screenshots = [];
const processes = [];

function parseArgs(args) {
  const result = { reportPath: "" };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--report") {
      result.reportPath = args[index + 1] ?? "";
      index += 1;
    }
  }
  return result;
}

function timestamp() {
  return new Date().toISOString();
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("failed to allocate port"));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

function startProcess(name, command, args, options = {}) {
  const { cwd = projectRoot, env = process.env } = options;
  const logPath = path.join(logsDir, `${name}.log`);
  const logStream = createWriteStream(logPath, { flags: "a" });
  logStream.write(`[${timestamp()}] ${command} ${args.join(" ")}\n`);

  const child = spawn(command, args, {
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

  processes.push({ child });
  return child;
}

async function stopProcess(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    return;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }
    await delay(250);
  }

  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    // already exited
  }
}

async function cleanupProcesses() {
  await Promise.allSettled(processes.map((entry) => stopProcess(entry.child)));
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

function resolveChromiumExecutable() {
  const candidates = [
    process.env.OPENSHOCK_CHROMIUM_PATH,
    "/snap/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      accessSync(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error("No executable Chromium binary found. Set OPENSHOCK_CHROMIUM_PATH to continue.");
}

async function capture(page, name) {
  const filePath = path.join(screenshotsDir, `${String(screenshots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  screenshots.push({ name, path: filePath });
}

async function startServices() {
  if (providedServiceTargets) {
    if (providedServiceTargets.serverURL) {
      await waitFor(async () => {
        const response = await fetch(`${providedServiceTargets.serverURL}/healthz`);
        return response.ok;
      }, `external server did not become healthy at ${providedServiceTargets.serverURL}/healthz`);
    }

    await waitFor(async () => {
      const response = await fetch(`${providedServiceTargets.webURL}/rooms`);
      return response.ok;
    }, `external web did not become ready at ${providedServiceTargets.webURL}/rooms`);

    return providedServiceTargets;
  }

  const workspaceRoot = path.join(artifactsDir, "workspace");
  const statePath = path.join(artifactsDir, "state.json");
  const webPort = await freePort();
  const serverPort = await freePort();
  const webURL = `http://127.0.0.1:${webPort}`;
  const serverURL = `http://127.0.0.1:${serverPort}`;

  await rm(path.join(projectRoot, "apps", "web", ".next"), { recursive: true, force: true });
  await mkdir(workspaceRoot, { recursive: true });

  startProcess("server", path.join(projectRoot, "scripts", "go.sh"), ["run", "./cmd/openshock-server"], {
    cwd: path.join(projectRoot, "apps", "server"),
    env: {
      ...process.env,
      OPENSHOCK_SERVER_ADDR: `127.0.0.1:${serverPort}`,
      OPENSHOCK_WORKSPACE_ROOT: workspaceRoot,
      OPENSHOCK_STATE_FILE: statePath,
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
    const response = await fetch(`${webURL}/rooms`);
    return response.ok;
  }, `web did not become ready at ${webURL}/rooms`);

  return { webURL, serverURL };
}

async function waitForVisible(locator, message) {
  await waitFor(async () => (await locator.count()) > 0 && (await locator.first().isVisible()), message);
}

async function visibleCount(locator) {
  return locator.evaluateAll((nodes) =>
    nodes.filter((node) => {
      const element = /** @type {HTMLElement} */ (node);
      return element.offsetParent !== null;
    }).length
  );
}

async function waitForUrlIncludes(page, fragment) {
  await waitFor(() => page.url().includes(fragment), `expected URL to include ${fragment}, got ${page.url()}`);
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

async function authenticateSeedOwner(page, webURL) {
  await page.goto(`${webURL}/access`, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const challengeResponse = await fetch("/api/control/v1/auth/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        action: "request_login_challenge",
        email: "larkspur@openshock.dev",
      }),
    });
    const challengePayload = await challengeResponse.json();
    if (!challengeResponse.ok) {
      throw new Error(`request_login_challenge -> ${challengeResponse.status}: ${JSON.stringify(challengePayload)}`);
    }

    const loginResponse = await fetch("/api/control/v1/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        email: "larkspur@openshock.dev",
        deviceLabel: "Owner Browser",
        challengeId: challengePayload.challenge?.id,
      }),
    });
    const loginPayload = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`auth/session -> ${loginResponse.status}: ${JSON.stringify(loginPayload)}`);
    }
  });
}

async function assertRoomSnapshotsStayCompact(page) {
  await page.locator('[data-testid^="room-snapshot-card-"]').first().waitFor();

  const state = await fetchBrowserControlState(page);
  for (const room of state.rooms ?? []) {
    if (!room?.id) {
      continue;
    }

    const card = page.getByTestId(`room-snapshot-card-${room.id}`);
    if ((await card.count()) === 0) {
      continue;
    }

    const text = (await card.first().textContent()) ?? "";
    const roomSummary = room.summary?.trim();
    if (roomSummary && text.includes(roomSummary)) {
      throw new Error(`room snapshot card ${room.id} repeated room summary instead of staying compact`);
    }

    const topicSummary = room.topic?.summary?.trim();
    if (topicSummary && text.includes(topicSummary)) {
      throw new Error(`room snapshot card ${room.id} repeated topic summary instead of staying compact`);
    }
  }
}

let browser;

try {
  const { webURL } = await startServices();
  browser = await launchChromiumSession(chromium);

  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  const results = [];

  await authenticateSeedOwner(page, webURL);
  await page.goto(`${webURL}/rooms`, { waitUntil: "domcontentloaded" });
  await waitForUrlIncludes(page, "/rooms");
  await waitForVisible(page.locator('[data-testid="quick-search-trigger-topbar"]'), "rooms shell did not render");
  await waitForVisible(page.locator('[data-testid="rooms-continue-card"]'), "rooms continue card did not render");
  await waitForVisible(page.locator('[data-testid="room-snapshot-card-room-memory"]'), "blocked room card did not render");

  assert.equal((await page.getByTestId("rooms-continue-title").textContent())?.trim(), "记忆写回讨论间");
  const continueCardText = (await page.getByTestId("rooms-continue-card").textContent()) ?? "";
  assert.match(continueCardText, /记忆写回讨论间/);
  assert.match(continueCardText, /现在先去/);
  assert.match(continueCardText, /执行详情/);
  assert.match(continueCardText, /正式的优先级规则/);
  assert.equal((await page.getByTestId("rooms-continue-reason").textContent())?.trim(), "阻塞 / 暂停优先");
  assert.equal(await visibleCount(page.getByTestId("rooms-continue-card").getByRole("link")), 1);

  const firstCard = page.locator('[data-testid^="room-snapshot-card-"]').first();
  const firstCardText = await firstCard.textContent();
  assert.match(firstCardText ?? "", /记忆写回讨论间/);
  assert.equal(
    await visibleCount(firstCard.getByRole("link")),
    1,
    "room snapshot card should keep exactly one always-visible primary action before expanding more"
  );
  await assertRoomSnapshotsStayCompact(page);
  await capture(page, "rooms-index");
  results.push("- `/rooms` 首屏只保留一个继续卡片和一个主 CTA；讨论快照卡不再复述 room/topic 摘要。");

  await page.getByTestId("rooms-continue-cta").click();
  await waitForUrlIncludes(page, "/rooms/room-memory?tab=run");
  await waitForVisible(page.locator('[data-testid="room-workbench-run-panel"]'), "memory room run panel did not open from rooms continue CTA");
  await waitForVisible(page.locator("text=记忆写回讨论间"), "memory room title did not render after continue CTA");
  await waitForVisible(page.getByTestId("room-header-primary-next-link"), "memory room primary next action did not render");
  const roomPrimaryActionText = (await page.getByTestId("room-header-primary-next-link").textContent())?.trim();
  const roomPrimaryActionHref = await page.getByTestId("room-header-primary-next-link").getAttribute("href");
  assert.equal(roomPrimaryActionText, "执行详情");
  assert.equal(roomPrimaryActionHref, "/rooms/room-memory/runs/run_memory_01");
  await capture(page, "room-memory");
  results.push("- continue CTA 现在会直接把用户带到被阻塞讨论的执行面，不再先进房再找真正下一步。");

  const report = [
    "# 2026-04-28 Rooms Continue Entry Report",
    "",
    `- Command: \`pnpm test:headed-rooms-continue-entry -- --report ${path.relative(projectRoot, reportPath)}\``,
    `- Artifacts Dir: \`${artifactsDir}\``,
    "",
    "## Results",
    ...results,
    "",
    "## Screenshots",
    ...screenshots.map((shot) => `- ${shot.name}: ${shot.path}`),
    "",
    "## Single Value",
    "- `/rooms` 首屏现在不仅点名该回哪一间讨论，还会把 blocked room 直接带到执行面；用户不必先进房再找真正下一步。",
  ].join("\n");

  await writeFile(reportPath, `${report}\n`, "utf8");
} finally {
  await Promise.allSettled([browser?.close(), cleanupProcesses()]);
}
