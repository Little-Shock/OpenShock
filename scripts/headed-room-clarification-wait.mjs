#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { accessSync, constants as fsConstants, createWriteStream, writeFileSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";
import { launchChromiumSession } from "./lib/playwright-chromium.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const evidenceRoot =
  process.env.OPENSHOCK_E2E_ARTIFACTS_DIR?.trim() ||
  (await mkdtemp(path.join(os.tmpdir(), "openshock-room-clarification-wait-")));
const artifactsDir = path.resolve(evidenceRoot);
const parsedArgs = parseArgs(process.argv.slice(2));
const reportPath = parsedArgs.reportPath
  ? path.resolve(projectRoot, parsedArgs.reportPath)
  : path.join(artifactsDir, "report.md");
const screenshotsDir = path.join(artifactsDir, "screenshots");
const logsDir = path.join(artifactsDir, "logs");
const webDistDirName = ".next-e2e-room-clarification-wait";
const webDistDir = path.join(projectRoot, "apps", "web", webDistDirName);

await mkdir(screenshotsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await mkdir(webDistDir, { recursive: true });

const screenshots = [];
const checks = [];
const processes = [];
const daemonHits = [];
let roomTurnCount = 0;

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function recordCheck(title, command, output) {
  checks.push({ title, command, output, result: "PASS" });
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

async function waitFor(predicate, message, timeoutMs = 120_000, intervalMs = 400) {
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

function trimLine(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function extractTurnAgent(prompt) {
  const byIdentity = prompt.match(/本轮请以 (.+?) 的身份回应/);
  if (byIdentity?.[1]) {
    return trimLine(byIdentity[1]);
  }
  return "";
}

function buildSyntheticResponse(prompt) {
  roomTurnCount += 1;
  if (roomTurnCount === 1) {
    return {
      preview: "先确认首屏是否只保留聊天和搜索入口？",
      output: [
        "SEND_PUBLIC_MESSAGE",
        "KIND: clarification_request",
        "BODY:",
        "请先确认首屏是否只保留聊天和搜索入口？",
      ].join("\n"),
    };
  }

  if (prompt.includes("只保留聊天和搜索入口")) {
    return {
      preview: "收到，我就按聊天和搜索入口继续推进。",
      output: [
        "SEND_PUBLIC_MESSAGE",
        "KIND: message",
        "CLAIM: keep",
        "BODY:",
        "收到，我就按聊天和搜索入口继续把第一版骨架收出来，其他入口先后置。",
      ].join("\n"),
    };
  }

  return {
    preview: "当前场景没有额外变化。",
    output: [
      "SEND_PUBLIC_MESSAGE",
      "KIND: summary",
      "BODY:",
      "当前场景没有额外变化。",
    ].join("\n"),
  };
}

async function startSyntheticDaemon({ port, workspaceRoot }) {
  const worktreeRoot = path.join(workspaceRoot, ".openshock-worktrees");
  await mkdir(worktreeRoot, { recursive: true });

  const server = createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/healthz") {
      daemonHits.push(`[${timestamp()}] GET /healthz`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "room-clarification-wait-daemon" }));
      return;
    }

    if (req.method === "GET" && req.url === "/v1/runtime") {
      daemonHits.push(`[${timestamp()}] GET /v1/runtime`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          runtimeId: "shock-main",
          daemonUrl: `http://127.0.0.1:${port}`,
          machine: "shock-main",
          detectedCli: ["claude"],
          providers: [
            {
              id: "claude",
              label: "Claude Code CLI",
              mode: "direct-cli",
              capabilities: ["conversation", "stream", "non-interactive-exec"],
              models: ["claude-sonnet-4"],
              transport: "http bridge",
            },
          ],
          shell: "bash",
          state: "online",
          workspaceRoot,
          reportedAt: new Date().toISOString(),
          heartbeatIntervalSeconds: 10,
          heartbeatTimeoutSeconds: 45,
        })
      );
      return;
    }

    if (req.method === "POST" && req.url === "/v1/worktrees/ensure") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        const payload = body ? JSON.parse(body) : {};
        const targetPath = path.join(worktreeRoot, payload.worktreeName || `wt-${Date.now()}`);
        await mkdir(targetPath, { recursive: true });
        daemonHits.push(`[${timestamp()}] POST /v1/worktrees/ensure worktree=${trimLine(payload.worktreeName)}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            workspaceRoot: payload.workspaceRoot || workspaceRoot,
            branch: payload.branch,
            worktreeName: payload.worktreeName,
            path: targetPath,
            created: true,
            baseRef: payload.baseRef || "HEAD",
          })
        );
      });
      return;
    }

    if (req.method === "POST" && (req.url === "/v1/exec" || req.url === "/v1/exec/stream")) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        const payload = body ? JSON.parse(body) : {};
        const response = buildSyntheticResponse(payload.prompt || "");
        daemonHits.push(
          `[${timestamp()}] ${req.method} ${req.url} provider=${trimLine(payload.provider)} agent=${extractTurnAgent(payload.prompt || "")}`
        );
        if (req.url === "/v1/exec") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              provider: payload.provider || "claude",
              command: [payload.provider || "claude", "--synthetic"],
              output: response.output,
              duration: "0.6s",
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/x-ndjson" });
        const events = [
          { type: "start", provider: payload.provider || "claude", command: [payload.provider || "claude", "--synthetic"] },
          { type: "stdout", provider: payload.provider || "claude", delta: `${response.preview}\n` },
          { type: "done", provider: payload.provider || "claude", output: response.output, duration: "1.0s" },
        ];
        for (const event of events) {
          res.write(`${JSON.stringify(event)}\n`);
          await delay(180);
        }
        res.end();
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  await new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}

async function fetchJSON(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `${url} failed: ${response.status}`);
  }
  return payload;
}

async function readState(serverURL) {
  return fetchJSON(`${serverURL}/v1/state`, { cache: "no-store" });
}

async function waitForServerReady(webURL, serverURL) {
  await waitFor(async () => {
    const response = await fetch(`${serverURL}/healthz`);
    return response.ok;
  }, `server did not become healthy at ${serverURL}/healthz`);

  await waitFor(async () => {
    const response = await fetch(`${webURL}/setup`);
    return response.ok;
  }, `web did not become ready at ${webURL}/setup`);
}

async function startServices() {
  const workspaceRoot = path.join(artifactsDir, "workspace");
  const statePath = path.join(artifactsDir, "state.json");
  const webPort = await freePort();
  const serverPort = await freePort();
  const daemonPort = await freePort();
  const webURL = `http://127.0.0.1:${webPort}`;
  const serverURL = `http://127.0.0.1:${serverPort}`;
  const daemon = await startSyntheticDaemon({ port: daemonPort, workspaceRoot });
  const nodeOptions = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} --max-old-space-size=4096`
    : "--max-old-space-size=4096";
  const webEnv = {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    OPENSHOCK_CONTROL_API_BASE: serverURL,
    NEXT_PUBLIC_OPENSHOCK_API_BASE: serverURL,
    OPENSHOCK_NEXT_DIST_DIR: webDistDirName,
  };
  const buildLogPath = path.join(logsDir, "web-build.log");

  await mkdir(workspaceRoot, { recursive: true });
  await rm(webDistDir, { recursive: true, force: true });
  await mkdir(webDistDir, { recursive: true });

  const buildResult = spawnSync("pnpm", ["--dir", "apps/web", "build"], {
    cwd: projectRoot,
    env: webEnv,
    encoding: "utf8",
  });
  writeFileSync(
    buildLogPath,
    [
      `[${timestamp()}] pnpm --dir apps/web build`,
      buildResult.stdout ?? "",
      buildResult.stderr ?? "",
      `[${timestamp()}] exited code=${buildResult.status} signal=${buildResult.signal ?? "null"}`,
      "",
    ].join("\n"),
    "utf8"
  );
  if (buildResult.status !== 0) {
    throw new Error(`web build failed before clarification wait scenario. See ${buildLogPath}`);
  }

  startProcess("server", path.join(projectRoot, "scripts", "go.sh"), ["run", "./cmd/openshock-server"], {
    cwd: path.join(projectRoot, "apps", "server"),
    env: {
      ...process.env,
      OPENSHOCK_SERVER_ADDR: `127.0.0.1:${serverPort}`,
      OPENSHOCK_WORKSPACE_ROOT: workspaceRoot,
      OPENSHOCK_STATE_FILE: statePath,
      OPENSHOCK_DAEMON_URL: daemon.url,
    },
  });

  startProcess(
    "web",
    "pnpm",
    ["--dir", "apps/web", "exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(webPort)],
    {
      cwd: projectRoot,
      env: webEnv,
    }
  );

  await waitForServerReady(webURL, serverURL);
  return { webURL, serverURL, daemon };
}

async function pairRuntime(serverURL, daemonURL) {
  await fetchJSON(`${serverURL}/v1/runtime/pairing`, {
    method: "POST",
    body: JSON.stringify({
      runtimeId: "shock-main",
      daemonUrl: daemonURL,
    }),
  });
}

async function updateAgentPersona(serverURL, agentId, next) {
  const agent = await fetchJSON(`${serverURL}/v1/agents/${agentId}`, { cache: "no-store" });
  await fetchJSON(`${serverURL}/v1/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: next.name,
      role: next.role,
      avatar: agent.avatar,
      prompt: next.prompt,
      operatingInstructions: next.operatingInstructions,
      providerPreference: agent.providerPreference,
      modelPreference: agent.modelPreference,
      recallPolicy: agent.recallPolicy,
      runtimePreference: "shock-main",
      memorySpaces: agent.memorySpaces,
      credentialProfileIds: agent.credentialProfileIds ?? [],
    }),
  });
}

async function createClarificationIssue(serverURL) {
  const payload = await fetchJSON(`${serverURL}/v1/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: "验证房间阻塞澄清卡片",
      summary: "确认 clarification wait 会在房间里显式展示，并在 reload 后继续可恢复。",
      owner: "折光交互",
      priority: "high",
    }),
  });
  return {
    roomId: payload.roomId,
    runId: payload.runId,
    sessionId: payload.sessionId,
  };
}

async function waitForVisibleText(page, text, message, timeoutMs = 30_000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: timeoutMs }).catch(() => {
    throw new Error(message);
  });
}

async function waitForButtonLabel(page, testId, label, message, timeoutMs = 30_000) {
  await waitFor(async () => {
    const text = await page.getByTestId(testId).textContent();
    return String(text ?? "").includes(label);
  }, message, timeoutMs, 200);
}

async function waitForButtonEnabled(page, testId, message, timeoutMs = 30_000) {
  await page.waitForFunction(
    (id) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return element instanceof HTMLButtonElement && !element.disabled;
    },
    testId,
    { timeout: timeoutMs }
  ).catch(() => {
    throw new Error(message);
  });
}

async function waitForInputEnabled(page, testId, message, timeoutMs = 30_000) {
  await page.waitForFunction(
    (id) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return element instanceof HTMLTextAreaElement && !element.disabled;
    },
    testId,
    { timeout: timeoutMs }
  ).catch(() => {
    throw new Error(message);
  });
}

async function waitForState(predicate, serverURL, message, timeoutMs = 60_000) {
  return waitFor(async () => {
    const state = await readState(serverURL);
    return (await predicate(state)) ? state : false;
  }, message, timeoutMs, 350);
}

function roomById(state, roomId) {
  return (state.rooms ?? []).find((item) => item.id === roomId) ?? null;
}

function runById(state, runId) {
  return (state.runs ?? []).find((item) => item.id === runId) ?? null;
}

function roomMessages(state, roomId) {
  return state.roomMessages?.[roomId] ?? [];
}

async function sendRoomMessage(page, roomId, prompt, expectedTexts) {
  await page.route(
    `**/v1/rooms/${roomId}/messages/stream`,
    async (route) => {
      await delay(900);
      await route.continue();
    },
    { times: 1 }
  );

  await page.getByTestId("room-message-input").fill(prompt);
  await waitForButtonEnabled(page, "room-send-message", "room send button did not become enabled");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes(`/v1/rooms/${roomId}/messages/stream`),
    { timeout: 30_000 }
  );

  await page.getByTestId("room-message-input").press("Enter");
  await waitForVisibleText(page, prompt, `human room message did not appear immediately: ${prompt}`);
  await waitForVisibleText(page, "正在生成回复", "room placeholder did not appear while streaming");
  await waitForButtonLabel(page, "room-send-message", "发送中", "room send button did not expose sending state");

  const response = await responsePromise;
  assert(response.ok(), `room send response failed with status ${response.status()}`);

  for (const text of expectedTexts) {
    await waitForVisibleText(page, text, `expected room copy did not become visible: ${text}`, 60_000);
  }

  await waitForButtonLabel(page, "room-send-message", "发送", "room send button did not recover after response", 60_000);
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

let daemon = null;
let browser = null;
let context = null;
let page = null;

try {
  resolveChromiumExecutable();
  const services = await startServices();
  daemon = services.daemon;

  await pairRuntime(services.serverURL, daemon.url);
  recordCheck("Pair Runtime", `POST ${services.serverURL}/v1/runtime/pairing`, `runtime shock-main paired to ${daemon.url}`);

  await updateAgentPersona(services.serverURL, "agent-claude-review-runner", {
    name: "折光交互",
    role: "交互架构师",
    prompt: "先把页面主路径和信息结构收紧，再决定哪些问题必须向人确认。",
    operatingInstructions: "公开回复只说当前判断或唯一阻塞问题，不写心理活动。",
  });
  recordCheck("Patch Persona", `PATCH ${services.serverURL}/v1/agents/agent-claude-review-runner`, "当前 room owner 已切到折光交互");

  const created = await createClarificationIssue(services.serverURL);
  recordCheck("Create Issue", `POST ${services.serverURL}/v1/issues`, `room=${created.roomId} run=${created.runId} session=${created.sessionId}`);

  browser = await launchChromiumSession(chromium);
  context = await browser.newContext({ viewport: { width: 1480, height: 1180 } });
  page = await context.newPage();

  await page.goto(`${services.webURL}/rooms/${created.roomId}`, { waitUntil: "load" });
  await page.getByTestId("room-message-input").waitFor({ state: "visible" });
  await capture(page, "room-initial");

  const firstPrompt = "先把电影网站首页的范围收一下。";
  const clarificationQuestion = "请先确认首屏是否只保留聊天和搜索入口？";
  await sendRoomMessage(page, created.roomId, firstPrompt, [clarificationQuestion]);

  const pausedState = await waitForState(
    async (state) => {
      const room = roomById(state, created.roomId);
      const run = runById(state, created.runId);
      return (
        room?.topic?.status === "paused" &&
        run?.status === "paused" &&
        (state.roomAgentWaits ?? []).some((item) => item.roomId === created.roomId && item.status === "waiting_reply")
      );
    },
    services.serverURL,
    "clarification wait did not settle into paused room truth"
  );
  assert(
    roomMessages(pausedState, created.roomId).some((message) => message.speaker === "折光交互" && message.message === clarificationQuestion),
    "clarification question did not persist into room messages"
  );

  await page.getByTestId("room-clarification-wait-card").waitFor({ state: "visible", timeout: 30_000 });
  assert(
    String(await page.getByTestId("room-clarification-wait-owner").textContent()).includes("折光交互"),
    "clarification wait card did not show the waiting owner"
  );
  assert(
    String(await page.getByTestId("room-clarification-wait-question").textContent()).includes(clarificationQuestion),
    "clarification wait card did not show the blocking question"
  );
  await waitForInputEnabled(page, "room-message-input", "room composer should stay editable while waiting for clarification");
  await page.getByTestId("room-message-input").fill("补充说明");
  await waitForButtonEnabled(page, "room-send-message", "room send button should become enabled once clarification text is provided");
  await page.getByTestId("room-message-input").fill("");
  recordCheck(
    "Clarification Wait Card",
    `GET ${services.webURL}/rooms/${created.roomId}`,
    "房间出现等待补充卡片，显示折光交互和阻塞问题；即使 run 处于 paused，输入框仍可编辑，填入补充后可以立即发送"
  );
  await capture(page, "room-clarification-card");

  await page.reload({ waitUntil: "load" });
  await page.getByTestId("room-message-input").waitFor({ state: "visible" });
  await page.getByTestId("room-clarification-wait-card").waitFor({ state: "visible", timeout: 30_000 });
  await waitForInputEnabled(page, "room-message-input", "room composer should stay editable after reload during clarification wait");
  await page.getByTestId("room-message-input").fill("重新加载后的补充");
  await waitForButtonEnabled(page, "room-send-message", "room send button should become enabled after reload once clarification text is provided");
  await page.getByTestId("room-message-input").fill("");
  recordCheck(
    "Clarification Wait Reload",
    `reload ${services.webURL}/rooms/${created.roomId}`,
    "reload 后等待补充卡片和可编辑 composer 都继续保持，不会因为刷新把房间卡死"
  );
  await capture(page, "room-clarification-card-reload");

  await page.getByTestId("room-clarification-wait-reply").click();
  await page.getByTestId("room-reply-target-chip").waitFor({ state: "visible", timeout: 30_000 });
  assert(
    String(await page.getByTestId("room-reply-target-label").textContent()).includes("折光交互"),
    "clarification wait reply action did not focus the blocking message"
  );
  recordCheck(
    "Clarification Reply Focus",
    `click ${services.webURL}/rooms/${created.roomId}#room-clarification-wait-reply`,
    "点击卡片上的“回复问题”后，会直接锁定到当前阻塞问题并进入回复状态"
  );

  const answerPrompt = "是，只保留聊天和搜索入口，其他入口后置。";
  await sendRoomMessage(page, created.roomId, answerPrompt, ["收到，我就按聊天和搜索入口继续把第一版骨架收出来"]);

  const resumedState = await waitForState(
    async (state) => {
      const room = roomById(state, created.roomId);
      const run = runById(state, created.runId);
      const waiting = (state.roomAgentWaits ?? []).some((item) => item.roomId === created.roomId && item.status === "waiting_reply");
      return room?.topic?.status === "running" && run?.status === "running" && !waiting;
    },
    services.serverURL,
    "clarification followup did not resume the room after reply"
  );
  assert(
    roomMessages(resumedState, created.roomId).some(
      (message) => message.speaker === "折光交互" && message.message.includes("只保留聊天和搜索入口")
    ),
    "followup reply did not persist into room messages"
  );
  await waitFor(
    async () => (await page.getByTestId("room-clarification-wait-card").count()) === 0,
    "clarification wait card should disappear after the reply resumes the room"
  );
  recordCheck(
    "Clarification Reply Resume",
    `POST ${services.serverURL}/v1/rooms/${created.roomId}/messages/stream`,
    "补充信息后，等待补充卡片自动消失，房间重新进入 running，并继续由折光交互往下推进"
  );
  await capture(page, "room-clarification-resumed");

  const report = [
    "# Headed Room Clarification Wait Report",
    "",
    `- Generated at: ${timestamp()}`,
    `- Web URL: ${services.webURL}`,
    `- Control URL: ${services.serverURL}`,
    `- Synthetic Daemon: ${daemon.url}`,
    `- Room ID: ${created.roomId}`,
    "",
    "## Verification",
    "",
    ...checks.flatMap((item) => [
      `### Check: ${item.title}`,
      "**Command run:**",
      `  ${item.command}`,
      "**Output observed:**",
      `  ${item.output}`,
      "",
    ]),
    "## Daemon Hits",
    "",
    ...daemonHits.map((line) => `- ${line}`),
    "",
    "## Screenshots",
    "",
    ...screenshots.map((item) => `- ${item.name}: ${item.path}`),
    "",
    "VERDICT: PASS",
  ].join("\n");

  await writeFile(reportPath, report, "utf8");
} finally {
  await Promise.allSettled([page?.close(), context?.close(), browser?.close()]);
  await cleanupProcesses();
  await daemon?.close?.();
}
