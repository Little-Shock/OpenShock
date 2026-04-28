#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
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
  (await mkdtemp(path.join(os.tmpdir(), "openshock-settings-primary-")));
const artifactsDir = path.resolve(evidenceRoot);
const parsedArgs = parseArgs(process.argv.slice(2));
const providedServiceTargets = resolveProvidedServiceTargets(process.argv.slice(2));
const reportPath = parsedArgs.reportPath
  ? path.resolve(projectRoot, parsedArgs.reportPath)
  : path.join(artifactsDir, "report.md");
const screenshotsDir = path.join(artifactsDir, "screenshots");
const logsDir = path.join(artifactsDir, "logs");

const screenshots = [];
const processes = [];

await mkdir(screenshotsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });

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
  const stream = createWriteStream(logPath, { flags: "a" });
  stream.write(`[${timestamp()}] ${command} ${args.join(" ")}\n`);

  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  child.stdout.pipe(stream);
  child.stderr.pipe(stream);
  child.on("exit", (code, signal) => {
    stream.write(`\n[${timestamp()}] exited code=${code} signal=${signal}\n`);
    stream.end();
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

async function waitForVisible(locator, message) {
  await waitFor(async () => (await locator.count()) > 0 && (await locator.first().isVisible()), message);
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
      const response = await fetch(`${providedServiceTargets.webURL}/settings`);
      return response.ok;
    }, `external web did not become ready at ${providedServiceTargets.webURL}/settings`);

    return providedServiceTargets;
  }

  const workspaceRoot = path.join(artifactsDir, "workspace");
  const statePath = path.join(artifactsDir, "state.json");
  const webPort = await freePort();
  const serverPort = await freePort();
  const webURL = `http://127.0.0.1:${webPort}`;
  const serverURL = `http://127.0.0.1:${serverPort}`;

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
        NEXT_PUBLIC_OPENSHOCK_API_BASE: serverURL,
      },
    }
  );

  await waitFor(async () => {
    const response = await fetch(`${serverURL}/healthz`);
    return response.ok;
  }, `server did not become healthy at ${serverURL}/healthz`);

  await waitFor(async () => {
    const response = await fetch(`${webURL}/settings`);
    return response.ok;
  }, `web did not become ready at ${webURL}/settings`);

  return { webURL, serverURL };
}

async function topOf(locator, label) {
  const box = await locator.boundingBox();
  assert.ok(box, `${label} should have a visible bounding box`);
  return box.y;
}

async function assertMainSettingsHierarchy(page) {
  await waitForVisible(page.getByTestId("settings-next-action-link"), "settings primary next action did not render");
  await waitForVisible(page.getByTestId("settings-workspace-pairing-status"), "settings machine pairing status did not render");
  await waitForVisible(page.getByTestId("settings-advanced-workspace-toggle"), "settings workspace disclosure did not render");
  await waitForVisible(page.getByTestId("settings-advanced-member-toggle"), "settings member disclosure did not render");
  await waitForVisible(page.getByTestId("settings-advanced-link"), "settings advanced link did not render");

  const advancedTop = await topOf(page.getByTestId("settings-advanced-link"), "advanced settings link");
  assert.ok(
    (await topOf(page.getByTestId("settings-workspace-pairing-status"), "machine pairing status")) < advancedTop,
    "machine defaults should appear before the advanced settings link"
  );
  assert.ok(
    (await topOf(page.getByTestId("settings-advanced-workspace-toggle"), "workspace disclosure")) < advancedTop,
    "workspace defaults should appear before the advanced settings link"
  );
  assert.ok(
    (await topOf(page.getByTestId("settings-advanced-member-toggle"), "member disclosure")) < advancedTop,
    "member defaults should appear before the advanced settings link"
  );

  for (const testId of [
    "settings-advanced-governance-summary",
    "settings-advanced-credential-summary",
    "settings-advanced-notification-summary",
  ]) {
    assert.equal(
      await page.getByTestId(testId).count(),
      0,
      `main settings page repeated advanced summary cards via ${testId}`
    );
  }
}

let browser;

try {
  const { webURL } = await startServices();
  browser = await launchChromiumSession(chromium);
  const page = await browser.newPage({ viewport: { width: 1560, height: 1180 } });
  const results = [];

  await page.goto(`${webURL}/settings`, { waitUntil: "domcontentloaded" });
  await assertMainSettingsHierarchy(page);
  await capture(page, "settings-primary");
  results.push("- `/settings` 主设置页先展示下一步、机器、工作区和个人偏好；高级设置只保留入口，不重复治理、凭据和通知摘要卡。");

  await page.getByTestId("settings-advanced-link").click();
  await page.waitForURL((url) => url.pathname === "/settings/advanced");
  await waitForVisible(page.getByTestId("settings-primary-link"), "advanced settings return link did not render");
  await waitForVisible(page.getByTestId("settings-advanced-page-governance-summary"), "advanced governance summary did not render");
  await waitForVisible(page.getByTestId("settings-advanced-page-credential-summary"), "advanced credential summary did not render");
  await waitForVisible(page.getByTestId("settings-advanced-page-notification-summary"), "advanced notification summary did not render");
  await capture(page, "settings-advanced");
  results.push("- `/settings/advanced` 继续承载治理、凭据和通知摘要，并保留返回主设置入口。");

  const report = [
    "# 2026-04-28 Settings Primary Reduction Report",
    "",
    `- Command: \`pnpm test:headed-settings-primary-reduction -- --report ${path.relative(projectRoot, reportPath)}\``,
    `- Artifacts Dir: \`${artifactsDir}\``,
    "",
    "## Results",
    ...results,
    "",
    "## Screenshots",
    ...screenshots.map((shot) => `- ${shot.name}: ${shot.path}`),
  ].join("\n");

  await writeFile(reportPath, `${report}\n`, "utf8");
} finally {
  await Promise.allSettled([browser?.close(), cleanupProcesses()]);
}
