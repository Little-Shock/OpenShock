import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const port = Number(process.env.SHELL_PORT || 4173);
const apiUpstream = process.env.SHELL_API_UPSTREAM || "http://127.0.0.1:7070";
const configuredApiBase = process.env.SHELL_API_BASE_URL || "";
const operatorAgentId = process.env.SHELL_OPERATOR_AGENT_ID || "shell_operator";

const mimeByExt = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

const FIXED_INTERVENTION_POINTS = [
  { id: "lead_plan", name: "Lead Plan", owner: "lead" },
  { id: "worker_dispatch", name: "Worker Dispatch", owner: "lead" },
  { id: "merge_closeout", name: "Merge Closeout", owner: "human" },
];

const server = http.createServer(async (req, res) => {
  try {
    const route = matchRoute(req.url || "/");

    if (route.kind === "runtime-config") {
      return writeRuntimeConfig(res);
    }

    if (route.kind === "shell-state") {
      return writeShellState(res);
    }

    if (route.kind === "approval-decision") {
      return handleApprovalDecision(req, res, route.approvalId);
    }

    if (route.kind === "intervention-action") {
      return handleInterventionAction(req, res, route.interventionId);
    }

    if (route.kind === "intervention-point-action") {
      return handleInterventionPointAction(req, res, route.pointId);
    }

    if (route.kind === "proxy-api") {
      return proxyApi(req, res, route.pathWithQuery);
    }

    if (route.kind === "asset") {
      return writeAsset(res, route.filePath);
    }

    return writeJson(res, 404, { error: "Not found" });
  } catch (error) {
    return writeJson(res, 500, { error: String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`OpenShock integrated shell listening on http://${host}:${port}`);
  console.log(`API upstream: ${apiUpstream}`);
});

function matchRoute(rawUrl) {
  const url = new URL(rawUrl, "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/runtime-config.js") {
    return { kind: "runtime-config" };
  }

  if (pathname === "/api/v0a/shell-state" && url.search.length === 0) {
    return { kind: "shell-state" };
  }

  const approvalDecisionMatch = pathname.match(/^\/api\/v0a\/approvals\/([^/]+)\/decision$/);
  if (approvalDecisionMatch) {
    return { kind: "approval-decision", approvalId: decodeURIComponent(approvalDecisionMatch[1]) };
  }

  const interventionActionMatch = pathname.match(/^\/api\/v0a\/interventions\/([^/]+)\/action$/);
  if (interventionActionMatch) {
    return { kind: "intervention-action", interventionId: decodeURIComponent(interventionActionMatch[1]) };
  }

  const interventionPointActionMatch = pathname.match(/^\/api\/v0a\/intervention-points\/([^/]+)\/action$/);
  if (interventionPointActionMatch) {
    return { kind: "intervention-point-action", pointId: decodeURIComponent(interventionPointActionMatch[1]) };
  }

  if (pathname.startsWith("/api/")) {
    return { kind: "proxy-api", pathWithQuery: `${pathname}${url.search}` };
  }

  if (pathname === "/" || pathname === "/index.html") {
    return { kind: "asset", filePath: path.resolve(root, "index.html") };
  }

  if (pathname === "/styles.css" || pathname.startsWith("/src/")) {
    return { kind: "asset", filePath: path.resolve(root, pathname.slice(1)) };
  }

  return { kind: "missing" };
}

async function writeAsset(res, filePath) {
  const safeRoot = `${root}${path.sep}`;
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(safeRoot)) {
    return writeJson(res, 403, { error: "Forbidden" });
  }
  const data = await fs.readFile(normalized);
  const extension = path.extname(normalized);
  const mime = mimeByExt.get(extension) || "application/octet-stream";
  res.writeHead(200, { "content-type": mime });
  res.end(data);
}

function writeRuntimeConfig(res) {
  const apiBaseUrl = configuredApiBase || `http://${host}:${port}`;
  const payload = `window.OPENSHOCK_SHELL_CONFIG = ${JSON.stringify({ apiBaseUrl })};`;
  res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
  res.end(payload);
}

async function writeShellState(res) {
  try {
    const runtimeConfig = await fetchUpstreamJson("/runtime/config");
    const topicId = resolveSampleTopicId(runtimeConfig);
    const [overview, coarse, messages] = await Promise.all([
      fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/overview`),
      fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/coarse`),
      fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/messages`),
    ]);
    const payload = buildShellStatePayload({ topicId, overview, coarse, messages });
    return writeJson(res, 200, payload);
  } catch (error) {
    return writeUpstreamError(res, error);
  }
}

async function handleApprovalDecision(req, res, approvalId) {
  try {
    if (req.method !== "POST") {
      return writeJson(res, 405, { error: "method_not_allowed" });
    }
    const input = await readJsonBody(req);
    const decision = normalizeDecision(input.decision);
    if (!decision) {
      return writeJson(res, 400, { error: "invalid_decision", message: "decision must be approve or reject" });
    }

    const runtimeConfig = await fetchUpstreamJson("/runtime/config");
    const topicId = resolveSampleTopicId(runtimeConfig);
    const operator = normalizeOperator(input.operator);
    await fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/agents`, {
      method: "POST",
      body: {
        agentId: operator,
        role: "human",
        status: "active",
      },
    });
    const result = await fetchUpstreamJson(
      `/topics/${encodeURIComponent(topicId)}/approvals/${encodeURIComponent(approvalId)}/decision`,
      {
        method: "POST",
        body: {
          decider: operator,
          approve: decision === "approve",
          interventionId: approvalId,
        },
      },
    );
    return writeJson(res, 200, result);
  } catch (error) {
    return writeUpstreamError(res, error);
  }
}

async function handleInterventionAction(req, res, interventionId) {
  try {
    if (req.method !== "POST") {
      return writeJson(res, 405, { error: "method_not_allowed" });
    }
    const input = await readJsonBody(req);
    const action = normalizeText(input.action);
    if (!action) {
      return writeJson(res, 400, { error: "invalid_action", message: "action is required" });
    }

    const runtimeConfig = await fetchUpstreamJson("/runtime/config");
    const topicId = resolveSampleTopicId(runtimeConfig);
    const operator = normalizeOperator(input.operator);
    await fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/agents`, {
      method: "POST",
      body: {
        agentId: operator,
        role: "human",
        status: "active",
      },
    });
    const result = await fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/messages`, {
      method: "POST",
      body: {
        type: "status_report",
        sourceAgentId: operator,
        sourceRole: "human",
        targetScope: "topic",
        payload: {
          event: "shell_intervention_action",
          interventionId,
          action,
          note: normalizeNote(input.note),
        },
      },
    });
    return writeJson(res, 200, result);
  } catch (error) {
    return writeUpstreamError(res, error);
  }
}

async function handleInterventionPointAction(req, res, pointId) {
  try {
    if (req.method !== "POST") {
      return writeJson(res, 405, { error: "method_not_allowed" });
    }
    const input = await readJsonBody(req);
    const action = normalizeInterventionPointAction(input.action);
    if (!action) {
      return writeJson(res, 400, { error: "invalid_action", message: "action must be approve, hold, or escalate" });
    }

    const runtimeConfig = await fetchUpstreamJson("/runtime/config");
    const topicId = resolveSampleTopicId(runtimeConfig);
    const result = await fetchUpstreamJson(`/topics/${encodeURIComponent(topicId)}/messages`, {
      method: "POST",
      body: {
        type: "status_report",
        sourceAgentId: normalizeOperator(input.operator),
        sourceRole: "human",
        targetScope: "topic",
        payload: {
          event: "shell_intervention_point_action",
          pointId,
          action,
          note: normalizeNote(input.note),
        },
      },
    });
    return writeJson(res, 200, result);
  } catch (error) {
    return writeUpstreamError(res, error);
  }
}

async function proxyApi(req, res, pathWithQuery) {
  const upstreamUrl = new URL(pathWithQuery, apiUpstream).toString();
  const headers = { ...req.headers };
  delete headers.host;
  delete headers["content-length"];

  const body = await readBody(req);
  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: body.length > 0 ? body : undefined,
    });
  } catch (error) {
    return writeJson(res, 502, { error: `upstream unavailable: ${String(error)}` });
  }

  const text = await upstreamResponse.text();
  const responseHeaders = {
    "content-type": upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8",
  };
  res.writeHead(upstreamResponse.status, responseHeaders);
  res.end(text);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const body = await readBody(req);
  if (body.length === 0) {
    return {};
  }
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new LocalRouteError(400, {
      error: "invalid_json",
      message: "request body must be valid JSON",
    });
  }
}

class LocalRouteError extends Error {
  constructor(statusCode, payload) {
    super(payload?.error || "local_route_error");
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

class UpstreamHttpError extends Error {
  constructor(statusCode, payload) {
    super(`upstream_http_${statusCode}`);
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

class UpstreamUnavailableError extends Error {
  constructor(original) {
    super("upstream_unavailable");
    this.original = original;
  }
}

async function fetchUpstreamJson(pathWithQuery, options = {}) {
  const url = new URL(pathWithQuery, apiUpstream).toString();
  const headers = {};
  const request = {
    method: options.method || "GET",
    headers,
  };
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    request.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, request);
  } catch (error) {
    throw new UpstreamUnavailableError(error);
  }
  const text = await response.text();
  const parsed = safeJsonParse(text);
  if (!response.ok) {
    throw new UpstreamHttpError(response.status, parsed || { error: "upstream_error", message: text });
  }
  return parsed || {};
}

function writeUpstreamError(res, error) {
  if (error instanceof LocalRouteError) {
    return writeJson(res, error.statusCode, error.payload);
  }
  if (error instanceof UpstreamHttpError) {
    return writeJson(res, error.statusCode, error.payload);
  }
  if (error instanceof UpstreamUnavailableError) {
    return writeJson(res, 502, { error: `upstream unavailable: ${String(error.original)}` });
  }
  return writeJson(res, 500, { error: String(error) });
}

function safeJsonParse(text) {
  if (!text || text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function resolveSampleTopicId(runtimeConfig) {
  const topicId = runtimeConfig?.sampleFixture?.topicId;
  if (typeof topicId !== "string" || topicId.trim().length === 0) {
    throw new LocalRouteError(502, {
      error: "runtime_config_invalid",
      message: "runtime config missing sampleFixture.topicId",
    });
  }
  return topicId.trim();
}

function normalizeDecision(decision) {
  if (decision === "approve" || decision === "reject") {
    return decision;
  }
  return null;
}

function normalizeInterventionPointAction(action) {
  if (action === "approve" || action === "hold" || action === "escalate") {
    return action;
  }
  return null;
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeOperator(value) {
  const normalized = normalizeText(value);
  return normalized || operatorAgentId;
}

function normalizeNote(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function buildShellStatePayload({ topicId, overview, coarse, messages }) {
  const now = Date.now();
  const leadAgent = Array.isArray(overview.agents)
    ? overview.agents.find((agent) => agent.role === "lead")
    : null;
  const pendingApprovals = Array.isArray(overview.pendingApprovals) ? overview.pendingApprovals : [];
  const openConflicts = Array.isArray(overview.openConflicts) ? overview.openConflicts : [];
  const blockers = Array.isArray(overview.blockers) ? overview.blockers : [];
  const allMessages = Array.isArray(messages) ? messages : [];

  return {
    generatedAt: new Date().toISOString(),
    topics: [
      {
        id: topicId,
        title: overview?.truth?.goal || "Integrated runtime topic",
        revision: Number(overview?.revision || 0),
        leadAgent: leadAgent?.agentId || "n/a",
        status: computeTopicStatus({ pendingApprovals, blockers, openConflicts }),
        pendingApprovals: pendingApprovals.length,
        deliveryState: coarse?.deliveryState?.state || "unknown",
        riskLevel: computeRiskLevel({ blockers, openConflicts }),
      },
    ],
    agents: mapAgents(overview?.agents, now),
    delivery: [
      {
        topicId,
        stage: coarse?.deliveryState?.state || "unknown",
        prState: coarse?.deliveryState?.prUrl ? "open" : "none",
        nextGate: pendingApprovals.length > 0 ? "human_gate_pending" : "none",
        updatedAt: coarse?.deliveryState?.lastUpdatedAt || overview?.updatedAt || new Date().toISOString(),
      },
    ],
    approvals: pendingApprovals.map((hold) => ({
      id: hold.holdId,
      gateType: hold.gate,
      topicId,
      runId: "runtime",
      requestedBy: "server",
      createdAt: hold.createdAt,
      note: `gate ${hold.gate}`,
      status: hold.status,
    })),
    interventionPoints: buildInterventionPoints(topicId, allMessages, coarse, pendingApprovals.length),
    interventions: buildInterventions(topicId, blockers, openConflicts),
    observability: {
      metrics: buildMetrics(coarse, blockers, openConflicts),
      events: buildEvents(topicId, allMessages, blockers, openConflicts),
    },
  };
}

function mapAgents(agents, nowMs) {
  if (!Array.isArray(agents)) {
    return [];
  }
  return agents.map((agent) => ({
    displayName: agent.agentId,
    role: agent.role,
    status: agent.status || "unknown",
    currentLane: agent.laneId || "topic",
    lastHeartbeatSec: secondsSince(agent.lastSeenAt, nowMs),
    blockedOn: agent.status === "blocked" ? "coordinator_blocker" : null,
  }));
}

function secondsSince(timestamp, nowMs) {
  const parsed = Date.parse(timestamp || "");
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  const diff = Math.floor((nowMs - parsed) / 1000);
  if (!Number.isFinite(diff) || diff < 0) {
    return 0;
  }
  return diff;
}

function computeTopicStatus({ pendingApprovals, blockers, openConflicts }) {
  if ((blockers?.length || 0) > 0 || (openConflicts?.length || 0) > 0) {
    return "blocked";
  }
  if ((pendingApprovals?.length || 0) > 0) {
    return "approval_required";
  }
  return "active";
}

function computeRiskLevel({ blockers, openConflicts }) {
  const blockerCount = blockers?.length || 0;
  const conflictCount = openConflicts?.length || 0;
  if (blockerCount > 0 || conflictCount > 0) {
    return "high";
  }
  return "low";
}

function buildInterventionPoints(topicId, messages, coarse, pendingApprovalCount) {
  const latestByPoint = new Map();
  for (const message of messages) {
    if (message?.type !== "status_report") {
      continue;
    }
    const payload = message.payload || {};
    if (payload.event !== "shell_intervention_point_action") {
      continue;
    }
    if (typeof payload.pointId !== "string" || payload.pointId.length === 0) {
      continue;
    }
    const previous = latestByPoint.get(payload.pointId);
    if (!previous || Date.parse(previous.createdAt) < Date.parse(message.createdAt)) {
      latestByPoint.set(payload.pointId, {
        action: payload.action,
        note: payload.note,
        createdAt: message.createdAt,
      });
    }
  }

  return FIXED_INTERVENTION_POINTS.map((point) => {
    const latest = latestByPoint.get(point.id);
    return {
      id: point.id,
      name: point.name,
      topicId,
      owner: point.owner,
      status: latest?.action ? mapInterventionPointStatus(latest.action) : defaultPointStatus(point.id, coarse, pendingApprovalCount),
      note: latest?.note || defaultPointNote(point.id, coarse),
      allowedActions: ["approve", "hold", "escalate"],
    };
  });
}

function defaultPointStatus(pointId, coarse, pendingApprovalCount) {
  if (pointId === "lead_plan") {
    return Number(coarse?.revision || 0) > 1 ? "approved" : "pending";
  }
  if (pointId === "worker_dispatch") {
    const activeAgents = Array.isArray(coarse?.activeAgents) ? coarse.activeAgents.length : 0;
    return activeAgents >= 2 ? "active" : "pending";
  }
  if (pointId === "merge_closeout") {
    if (pendingApprovalCount > 0 || coarse?.deliveryState?.state === "awaiting_merge_gate") {
      return "pending";
    }
    if (coarse?.deliveryState?.state === "pr_ready") {
      return "approved";
    }
  }
  return "pending";
}

function defaultPointNote(pointId, coarse) {
  if (pointId === "merge_closeout") {
    return `delivery=${coarse?.deliveryState?.state || "unknown"}`;
  }
  return "runtime-linked";
}

function mapInterventionPointStatus(action) {
  if (action === "approve") {
    return "approved";
  }
  if (action === "hold") {
    return "hold";
  }
  if (action === "escalate") {
    return "blocked";
  }
  return "pending";
}

function buildInterventions(topicId, blockers, openConflicts) {
  const interventions = [];
  for (const blocker of blockers || []) {
    interventions.push({
      id: blocker.blockerId || `blocker_${interventions.length + 1}`,
      type: "blocker",
      topicId,
      runId: blocker.runId || "runtime",
      requestedBy: blocker.messageId || "coordinator",
      createdAt: blocker.createdAt || new Date().toISOString(),
      note: blocker.reason || "runtime blocker",
      status: "pending",
      recommendedActions: ["request_report", "reroute"],
    });
  }
  for (const conflict of openConflicts || []) {
    interventions.push({
      id: conflict.conflictId || `conflict_${interventions.length + 1}`,
      type: "conflict",
      topicId,
      runId: "runtime",
      requestedBy: conflict.challengeMessageId || "coordinator",
      createdAt: conflict.createdAt || new Date().toISOString(),
      note: "unresolved challenge",
      status: "pending",
      recommendedActions: ["request_report", "escalate"],
    });
  }
  return interventions;
}

function buildMetrics(coarse, blockers, openConflicts) {
  const activeAgents = Array.isArray(coarse?.activeAgents) ? coarse.activeAgents.length : 0;
  const blockedAgents = Array.isArray(coarse?.blockedAgents) ? coarse.blockedAgents.length : 0;
  const pendingApprovals = Number(coarse?.pendingApprovalCount || 0);
  const blockerCount = Number(coarse?.blockerCount || (blockers?.length || 0));
  const conflictCount = Number(coarse?.openConflictCount || (openConflicts?.length || 0));

  return [
    {
      label: "Active Agents",
      value: String(activeAgents),
      delta: blockedAgents > 0 ? `${blockedAgents} blocked` : "all clear",
      trend: blockedAgents > 0 ? "down" : "flat",
    },
    {
      label: "Pending Approvals",
      value: String(pendingApprovals),
      delta: pendingApprovals > 0 ? "human gate waiting" : "none",
      trend: pendingApprovals > 0 ? "up" : "flat",
    },
    {
      label: "Blockers",
      value: String(blockerCount),
      delta: conflictCount > 0 ? `${conflictCount} open conflicts` : "stable",
      trend: blockerCount > 0 || conflictCount > 0 ? "up" : "flat",
    },
  ];
}

function buildEvents(topicId, messages, blockers, openConflicts) {
  const timeline = [];
  for (const message of messages || []) {
    const eventName = normalizeText(message?.payload?.event);
    timeline.push({
      at: message.createdAt || new Date().toISOString(),
      topicId,
      message: eventName
        ? `${message.type} (${eventName}) · ${message.state}`
        : `${message.type} · ${message.state}`,
      severity: deriveSeverity(message),
    });
  }
  for (const blocker of blockers || []) {
    timeline.push({
      at: blocker.createdAt || new Date().toISOString(),
      topicId,
      message: `blocker · ${blocker.reason || "runtime blocker"}`,
      severity: "warning",
    });
  }
  for (const conflict of openConflicts || []) {
    timeline.push({
      at: conflict.createdAt || new Date().toISOString(),
      topicId,
      message: `conflict · ${conflict.conflictId}`,
      severity: "warning",
    });
  }

  timeline.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return timeline.slice(0, 20);
}

function deriveSeverity(message) {
  if (message?.state === "rejected" || message?.state === "blocked_conflict") {
    return "warning";
  }
  if (message?.type === "blocker_escalation" || message?.type === "challenge") {
    return "warning";
  }
  return "info";
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
