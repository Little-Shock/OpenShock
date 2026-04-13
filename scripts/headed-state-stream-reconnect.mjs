#!/usr/bin/env node

import { spawn } from "node:child_process";
import { accessSync, constants as fsConstants, createWriteStream } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";
import { cleanNextE2EArtifacts } from "./clean-next-e2e-dist.mjs";
import { launchChromiumSession } from "./lib/playwright-chromium.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const artifactsDir = await mkdtemp(path.join(os.tmpdir(), "openshock-state-stream-reconnect-"));
const screenshotsDir = path.join(artifactsDir, "screenshots");
const logsDir = path.join(artifactsDir, "logs");
const reportPath = path.join(artifactsDir, "report.md");
const webDistDirName = `.next-e2e-state-stream-reconnect-${path.basename(artifactsDir)}`;
const webDistDir = path.join(projectRoot, "apps", "web", webDistDirName);

await mkdir(screenshotsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });

const processes = [];
const screenshots = [];
const findings = [];

function timestamp() {
  return new Date().toISOString();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function record(message) {
  findings.push(`- ${message}`);
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

  processes.push(child);
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

async function cleanup() {
  await Promise.allSettled(processes.map((child) => stopProcess(child)));
}

async function waitFor(predicate, message, timeoutMs = 120_000, intervalMs = 250) {
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

async function capture(page, name) {
  const filePath = path.join(screenshotsDir, `${String(screenshots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  screenshots.push({ name, path: filePath });
}

async function readVisibleMachineCount(page) {
  return page.evaluate(() => {
    const match = document.body.innerText.match(/(\d+)\s*台机器/);
    if (!match) {
      return null;
    }
    return Number.parseInt(match[1] ?? "", 10);
  });
}

async function startServices() {
  const workspaceRoot = path.join(artifactsDir, "workspace");
  const statePath = path.join(artifactsDir, "state.json");
  const webPort = await freePort();
  const serverPort = await freePort();
  const webURL = `http://127.0.0.1:${webPort}`;
  const serverURL = `http://127.0.0.1:${serverPort}`;

  await mkdir(workspaceRoot, { recursive: true });
  await rm(webDistDir, { recursive: true, force: true });
  await mkdir(webDistDir, { recursive: true });

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
        OPENSHOCK_NEXT_DIST_DIR: webDistDirName,
      },
    }
  );

  await waitFor(async () => {
    const response = await fetch(`${serverURL}/healthz`);
    return response.ok;
  }, `server did not become healthy at ${serverURL}/healthz`);

  await waitFor(async () => {
    const response = await fetch(`${webURL}/chat/all`);
    return response.ok;
  }, `web did not become ready at ${webURL}/chat/all`);

  return { webURL, serverURL };
}

async function postRuntimeHeartbeat(serverURL, workspaceRoot, machine) {
  const response = await fetch(`${serverURL}/v1/runtime/heartbeats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      runtimeId: machine,
      daemonUrl: "http://127.0.0.1:8090",
      machine,
      detectedCli: ["codex"],
      state: "online",
      workspaceRoot,
      reportedAt: new Date().toISOString(),
      heartbeatIntervalSeconds: 12,
      heartbeatTimeoutSeconds: 48,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status !== 200) {
    throw new Error(`runtime heartbeat post failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload;
}

let browser;

try {
  resolveChromiumExecutable();
  const { webURL, serverURL } = await startServices();
  const workspaceRoot = path.join(artifactsDir, "workspace");

  browser = await launchChromiumSession(chromium);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  await page.addInitScript(() => {
    const NativeEventSource = window.EventSource;
    if (!NativeEventSource) {
      return;
    }

    const registry = [];

    class WrappedEventSource {
      constructor(url, config) {
        this.url = String(url);
        this.readyState = 0;
        this.withCredentials = false;
        this.lastSequence = 0;
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.__native = new NativeEventSource(url, config);

        this.__native.addEventListener("open", (event) => {
          this.readyState = this.__native.readyState;
          if (typeof this.onopen === "function") {
            this.onopen.call(this, event);
          }
        });
        this.__native.addEventListener("message", (event) => {
          if (typeof this.onmessage === "function") {
            this.onmessage.call(this, event);
          }
        });
        this.__native.addEventListener("error", (event) => {
          this.readyState = this.__native.readyState;
          if (typeof this.onerror === "function") {
            this.onerror.call(this, event);
          }
        });
        for (const type of ["snapshot", "delta", "resync"]) {
          this.__native.addEventListener(type, (event) => {
            try {
              const payload = JSON.parse(event.data);
              if (typeof payload?.sequence === "number" && payload.sequence > 0) {
                this.lastSequence = payload.sequence;
              }
            } catch {
              // Ignore malformed event payloads; the wrapped app listener will handle them.
            }
          });
        }
      }

      addEventListener(type, listener, options) {
        this.__native.addEventListener(type, listener, options);
      }

      removeEventListener(type, listener, options) {
        this.__native.removeEventListener(type, listener, options);
      }

      close() {
        this.__native.close();
        this.readyState = 2;
      }

      forceError() {
        this.__native.close();
        this.readyState = 2;
        if (typeof this.onerror === "function") {
          this.onerror.call(this, new Event("error"));
        }
      }
    }

    WrappedEventSource.CONNECTING = NativeEventSource.CONNECTING;
    WrappedEventSource.OPEN = NativeEventSource.OPEN;
    WrappedEventSource.CLOSED = NativeEventSource.CLOSED;

    Object.defineProperty(window, "__openshockEventSources", {
      configurable: true,
      writable: true,
      value: registry,
    });

    Object.defineProperty(window, "EventSource", {
      configurable: true,
      writable: true,
      value: function WrappedEventSourceFactory(url, config) {
        const instance = new WrappedEventSource(url, config);
        registry.push(instance);
        return instance;
      },
    });

    window.EventSource.CONNECTING = WrappedEventSource.CONNECTING;
    window.EventSource.OPEN = WrappedEventSource.OPEN;
    window.EventSource.CLOSED = WrappedEventSource.CLOSED;
  });

  await page.goto(`${webURL}/chat/all`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("channel-message-input").waitFor({ state: "visible", timeout: 120_000 });
  await waitFor(
    async () => (await page.evaluate(() => Array.isArray(window.__openshockEventSources) ? window.__openshockEventSources.length : 0)) >= 1,
    "initial EventSource did not attach"
  );

  const initialUrl = await page.evaluate(() => window.__openshockEventSources[0]?.url ?? "");
  assert(initialUrl.includes("/v1/state/stream"), `initial EventSource url = ${initialUrl}, want /v1/state/stream`);
  assert(initialUrl.includes("since="), `initial EventSource should resume from hydrated sequence, got ${initialUrl}`);
  record(`首次 EventSource 已建立，并带上 hydrated sequence：${initialUrl} -> PASS`);
  await waitFor(
    async () => (await page.evaluate(() => window.__openshockEventSources[0]?.lastSequence ?? 0)) > 0,
    "initial EventSource did not receive a sequence-bearing event"
  );
  await capture(page, "initial-chat");

  await page.evaluate(() => window.__openshockEventSources[0]?.forceError());

  await waitFor(
    async () => (await page.evaluate(() => Array.isArray(window.__openshockEventSources) ? window.__openshockEventSources.length : 0)) >= 2,
    "reconnect EventSource did not attach"
  );

  const reconnectUrl = await page.evaluate(() => window.__openshockEventSources[1]?.url ?? "");
  assert(reconnectUrl.includes("since="), `reconnect EventSource url = ${reconnectUrl}, want since replay cursor`);
  record(`断线后前端重新建立 EventSource，并带上 replay cursor：${reconnectUrl} -> PASS`);

  const initialMachineCount = await readVisibleMachineCount(page);
  assert(Number.isInteger(initialMachineCount), "initial machine count badge was not visible");
  record(`当前页面机器数基线 = ${initialMachineCount}`);

  const machineName = `shock-reconnect-${Date.now()}`;
  await postRuntimeHeartbeat(serverURL, workspaceRoot, machineName);
  record(`断线后补发 runtime heartbeat：${machineName} -> PASS`);
  await waitFor(
    async () => (await readVisibleMachineCount(page)) === initialMachineCount + 1,
    "runtime heartbeat change did not appear after reconnect"
  );
  record(`断线后页面机器数从 ${initialMachineCount} 增长到 ${initialMachineCount + 1}，说明 reconnect + catch-up 生效 -> PASS`);
  await capture(page, "reconnected-chat");

  const report = [
    "# Headed State Stream Reconnect Report",
    "",
    `- Generated at: ${timestamp()}`,
    `- Web URL: ${webURL}`,
    `- Control URL: ${serverURL}`,
    "",
    "## Checks",
    ...findings,
    "",
    "## Screenshots",
    ...screenshots.map((item) => `- ${item.name}: ${item.path}`),
    "",
    "VERDICT: PASS",
    "",
  ].join("\n");

  await writeFile(reportPath, report, "utf8");
  console.log(`Report written to ${reportPath}`);
} finally {
  await browser?.close().catch(() => {});
  await cleanup();
  await rm(webDistDir, { recursive: true, force: true }).catch(() => {});
  await cleanNextE2EArtifacts(projectRoot).catch(() => {});
}
