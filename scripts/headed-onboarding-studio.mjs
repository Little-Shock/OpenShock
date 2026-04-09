#!/usr/bin/env node

import { spawn } from "node:child_process";
import { accessSync, constants as fsConstants, createWriteStream } from "node:fs";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const evidenceRoot =
  process.env.OPENSHOCK_E2E_ARTIFACTS_DIR?.trim() ||
  (await mkdtemp(path.join(os.tmpdir(), "openshock-tkt34-onboarding-")));
const artifactsDir = path.resolve(evidenceRoot);
const parsedArgs = parseArgs(process.argv.slice(2));
const reportPath = parsedArgs.reportPath
  ? path.resolve(projectRoot, parsedArgs.reportPath)
  : path.join(artifactsDir, "report.md");
const runDir = path.join(artifactsDir, "run");
const screenshotsDir = path.join(runDir, "screenshots");
const logsDir = path.join(runDir, "logs");
const workspaceRoot = path.join(runDir, "workspace");
const statePath = path.join(runDir, "state.json");

const processes = [];
const screenshots = [];

await mkdir(screenshotsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });
await mkdir(workspaceRoot, { recursive: true });

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
  const { cwd = projectRoot, env = process.env, logPath } = options;
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

  processes.push({ name, child });
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

async function waitForHealth(serverURL) {
  await waitFor(async () => {
    const response = await fetch(`${serverURL}/healthz`);
    return response.ok;
  }, `server did not become healthy at ${serverURL}/healthz`);
}

async function startWeb(webPort, serverURL) {
  startProcess("web", "pnpm", ["--dir", "apps/web", "exec", "next", "dev", "--hostname", "127.0.0.1", "--port", String(webPort)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_OPENSHOCK_API_BASE: serverURL,
    },
    logPath: path.join(logsDir, "web.log"),
  });
  const webURL = `http://127.0.0.1:${webPort}`;
  await waitFor(async () => {
    const response = await fetch(`${webURL}/setup`);
    return response.ok;
  }, `web did not become ready at ${webURL}/setup`);
  return webURL;
}

function startServer(serverPort) {
  return startProcess("server", path.join(projectRoot, "scripts", "go.sh"), ["run", "./cmd/openshock-server"], {
    cwd: path.join(projectRoot, "apps", "server"),
    env: {
      ...process.env,
      OPENSHOCK_SERVER_ADDR: `127.0.0.1:${serverPort}`,
      OPENSHOCK_WORKSPACE_ROOT: workspaceRoot,
      OPENSHOCK_STATE_FILE: statePath,
    },
    logPath: path.join(logsDir, "server.log"),
  });
}

async function readText(page, testID) {
  return (await page.getByTestId(testID).textContent())?.trim() ?? "";
}

async function waitForText(page, testID, expected) {
  await waitFor(async () => (await readText(page, testID)) === expected, `${testID} did not become ${expected}`);
}

let browser;

try {
  const webPort = await freePort();
  const serverPort = await freePort();
  const serverURL = `http://127.0.0.1:${serverPort}`;
  let serverChild = startServer(serverPort);
  await waitForHealth(serverURL);
  const webURL = await startWeb(webPort, serverURL);

  browser = await chromium.launch({
    executablePath: resolveChromiumExecutable(),
    headless: process.env.OPENSHOCK_E2E_HEADLESS === "1",
  });

  const results = [];
  const page = await browser.newPage({ viewport: { width: 1560, height: 1280 } });

  await page.goto(`${webURL}/setup`, { waitUntil: "domcontentloaded" });
  await waitFor(async () => (await page.getByTestId("setup-template-select-research-team").count()) > 0, "onboarding studio did not render");
  await capture(page, "setup-before-template");

  await page.getByTestId("setup-template-select-research-team").click();
  await waitForText(page, "setup-onboarding-success", "研究团队 模板已经写回 workspace truth；reload / restart 后会继续从当前 setup step 恢复。");
  await waitForText(page, "setup-onboarding-template-package", "研究团队");
  await waitFor(async () => (await readText(page, "setup-onboarding-materialized-channels")).includes("#intake"), "research-team channels were not materialized");
  await capture(page, "setup-after-template-select");
  results.push("- `/setup` 现在可以直接选择 `研究团队` 模板，并把 bootstrap package 写回 workspace onboarding truth。");

  await page.getByTestId("setup-onboarding-refresh-progress").click();
  await waitForText(page, "setup-onboarding-current-step", "bootstrap-finished");
  await capture(page, "setup-progress-ready");
  results.push("- repo binding / runtime pairing 的 live truth 会把 onboarding progress 前滚到可 finish 状态，而不是停在本地步骤卡。");

  await page.getByTestId("setup-onboarding-finish").click();
  await waitForText(page, "setup-onboarding-success", "onboarding studio 已收口为 done；workspace 会把 `/rooms` 当成下一跳，而不是继续停在 setup。");
  await waitForText(page, "setup-onboarding-status", "done");
  await waitForText(page, "setup-onboarding-resume-url", "/rooms");
  await capture(page, "setup-finished");
  results.push("- 完成首次启动后，`/setup` 会把 status、resume route 和 materialized package 一起收平到 durable workspace snapshot。");

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForText(page, "setup-onboarding-template", "research-team");
  await waitForText(page, "setup-onboarding-status", "done");
  await waitForText(page, "setup-onboarding-resume-url", "/rooms");
  await waitForText(page, "setup-onboarding-template-package", "研究团队");
  await capture(page, "setup-after-reload");
  results.push("- 立即 reload 后，模板选择、done 状态和 `/rooms` resume route 继续从同一份 workspace truth 读取。");

  await stopProcess(serverChild);
  serverChild = startServer(serverPort);
  await waitForHealth(serverURL);

  await page.goto(`${webURL}/settings`, { waitUntil: "domcontentloaded" });
  await waitForText(page, "settings-workspace-template-text", "research-team");
  await waitFor(async () => (await readText(page, "settings-workspace-onboarding-value")).includes("已完成 / bootstrap-finished"), "settings did not project finished onboarding truth");
  await capture(page, "settings-after-server-restart");
  results.push("- 重启 server 后，`/settings` 仍投影同一份 template + onboarding progress durable truth。");

  const secondContext = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const secondPage = await secondContext.newPage();
  await secondPage.goto(`${webURL}/setup`, { waitUntil: "domcontentloaded" });
  await waitForText(secondPage, "setup-onboarding-template-package", "研究团队");
  await waitForText(secondPage, "setup-onboarding-status", "done");
  await waitForText(secondPage, "setup-onboarding-resume-url", "/rooms");
  await capture(secondPage, "setup-second-context");
  await secondContext.close();
  results.push("- 第二个浏览器上下文仍读到同一份 onboarding studio truth，说明恢复不依赖单个 tab。");

  const reportLines = [
    "# Test Report 2026-04-09 Onboarding Studio / Scenario Templates",
    "",
    `- Command: \`pnpm test:headed-onboarding-studio -- --report ${path.relative(projectRoot, reportPath)}\``,
    `- Generated At: ${timestamp()}`,
    "",
    "## Result",
    "",
    ...results,
    "",
    "## Evidence",
    "",
    ...screenshots.map((item) => `- ${item.name}: \`${path.relative(projectRoot, item.path)}\``),
    "",
    "## Scope",
    "",
    "- 在 `/setup` 选择 `研究团队` 模板，并验证 materialized bootstrap package。",
    "- 依据当前 repo binding / runtime pairing live truth 刷新 onboarding progress，再完成首次启动。",
    "- 验证 reload、server restart 与 second browser context 之后仍能读回同一份 onboarding truth。",
  ];

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${reportLines.join("\n")}\n`, "utf8");
} finally {
  if (browser) {
    await browser.close().catch(() => {});
  }
  await cleanupProcesses();
}
