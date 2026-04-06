const runtimeConfig = resolveRuntimeConfig();

const ENDPOINTS = {
  state: toApiUrl(runtimeConfig.apiBaseUrl, "/api/v0a/shell-state"),
  approvalDecision: (approvalId) =>
    toApiUrl(runtimeConfig.apiBaseUrl, `/api/v0a/approvals/${encodeURIComponent(approvalId)}/decision`),
  interventionAction: (interventionId) =>
    toApiUrl(runtimeConfig.apiBaseUrl, `/api/v0a/interventions/${encodeURIComponent(interventionId)}/action`),
  interventionPointAction: (pointId) =>
    toApiUrl(runtimeConfig.apiBaseUrl, `/api/v0a/intervention-points/${encodeURIComponent(pointId)}/action`),
  runFollowUp: (runId) => toApiUrl(runtimeConfig.apiBaseUrl, `/api/v0a/runs/${encodeURIComponent(runId)}/follow-up`),
};

const POLL_MS = 5000;

const dom = {
  refreshButton: document.getElementById("refresh-button"),
  lastUpdated: document.getElementById("last-updated"),
  metricCards: document.getElementById("metric-cards"),
  roomList: document.getElementById("room-list"),
  topicBody: document.getElementById("topic-table-body"),
  runList: document.getElementById("run-list"),
  inboxList: document.getElementById("inbox-list"),
  approvalList: document.getElementById("approval-list"),
  interventionList: document.getElementById("intervention-list"),
  interventionPointsList: document.getElementById("intervention-points-list"),
  eventFeed: document.getElementById("event-feed"),
  actionTemplate: document.getElementById("queue-action-template"),
};

let loading = false;
let latestPayload = null;
let selectedTopicId = null;

dom.refreshButton.addEventListener("click", () => {
  void loadAndRender();
});

void loadAndRender();
window.setInterval(() => void loadAndRender(), POLL_MS);

async function loadAndRender() {
  if (loading) {
    return;
  }
  loading = true;
  dom.refreshButton.disabled = true;
  try {
    const payload = await requestJson(ENDPOINTS.state, { method: "GET" });
    render(payload);
  } catch (error) {
    renderError(error);
  } finally {
    loading = false;
    dom.refreshButton.disabled = false;
  }
}

function render(payload) {
  latestPayload = payload;
  const topics = Array.isArray(payload.topics) ? payload.topics : [];
  ensureSelectedTopic(topics);

  dom.lastUpdated.textContent = `Last updated: ${new Date(payload.generatedAt).toLocaleString()}`;
  renderMetrics(payload.observability?.metrics || []);
  renderRooms(topics);
  renderTopicWorkspace(topics);
  renderRuns(payload.runs || []);
  renderInbox(payload);
  renderApprovalQueue(payload.approvals || []);
  renderInterventionQueue(payload.interventions || []);
  renderCloseoutPoints(payload.interventionPoints || []);
  renderEvents(payload.observability?.events || []);
}

function renderError(error) {
  dom.lastUpdated.textContent = `Last updated: failed (${String(error)}) [api=${runtimeConfig.apiBaseUrl}]`;
}

function ensureSelectedTopic(topics) {
  if (!Array.isArray(topics) || topics.length === 0) {
    selectedTopicId = null;
    return;
  }
  if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
    return;
  }
  selectedTopicId = topics[0].id;
}

function renderMetrics(metrics) {
  dom.metricCards.replaceChildren();
  for (const metric of metrics) {
    const card = document.createElement("article");
    card.className = "metric-card";

    const label = document.createElement("span");
    label.className = "metric-label";
    label.textContent = metric.label;

    const value = document.createElement("div");
    value.className = "metric-value";
    value.textContent = metric.value;

    const trend = document.createElement("div");
    trend.className =
      metric.trend === "up" ? "metric-trend-up" : metric.trend === "down" ? "metric-trend-down" : "";
    trend.textContent = metric.delta;

    card.append(label, value, trend);
    dom.metricCards.append(card);
  }
}

function renderRooms(topics) {
  dom.roomList.replaceChildren();
  if (!Array.isArray(topics) || topics.length === 0) {
    dom.roomList.textContent = "No room available.";
    return;
  }

  for (const topic of topics) {
    const card = queueCard({
      title: `Room ${topic.id}`,
      subtitle: `${topic.title} · lead ${topic.leadAgent}`,
      note: `status=${topic.status} · delivery=${topic.deliveryState} · pending=${topic.pendingApprovals}`,
      status: topic.id === selectedTopicId ? "active" : topic.status,
    });
    card.classList.add("room-card");
    card.addEventListener("click", () => {
      selectedTopicId = topic.id;
      if (latestPayload) {
        render(latestPayload);
      }
    });
    dom.roomList.append(card);
  }
}

function renderTopicWorkspace(topics) {
  dom.topicBody.replaceChildren();
  const topic = Array.isArray(topics) ? topics.find((item) => item.id === selectedTopicId) : null;
  if (!topic) {
    return;
  }

  const row = document.createElement("tr");
  row.append(
    cell(`Room ${topic.id}`),
    cell(`${topic.id} · ${topic.title}`),
    cell(String(topic.revision)),
    statusCell(topic.status),
    cell(topic.leadAgent),
    cell(String(topic.pendingApprovals)),
    cell(topic.deliveryState),
    cell(topic.riskLevel),
  );
  dom.topicBody.append(row);
}

function renderRuns(runs) {
  dom.runList.replaceChildren();
  const normalizedRuns = Array.isArray(runs) ? runs : [];
  if (normalizedRuns.length === 0) {
    dom.runList.textContent = "No runs in workspace.";
    return;
  }

  for (const run of normalizedRuns) {
    const runId = normalizeText(run.runId) || "unknown_run";
    const card = queueCard({
      title: `Run ${runId}`,
      subtitle: `${run.state || "unknown"} · ${formatTime(run.updatedAt)}`,
      note: run.summary || "run summary unavailable",
      status: run.state || "pending",
    });

    const actions = document.createElement("div");
    actions.className = "queue-actions";
    actions.append(
      queueAction("Request follow-up", async () => {
        await requestJson(ENDPOINTS.runFollowUp(runId), {
          method: "POST",
          body: {
            operator: "shell-operator",
            note: `follow-up requested from room ${selectedTopicId || "n/a"}`,
          },
        });
        await loadAndRender();
      }),
    );

    card.append(actions);
    dom.runList.append(card);
  }
}

function renderInbox(payload) {
  dom.inboxList.replaceChildren();

  const approvals = (payload.approvals || []).filter((item) => item.status === "pending");
  const interventions = (payload.interventions || []).filter((item) => item.status === "pending");
  const closeoutPoints = (payload.interventionPoints || []).filter(
    (item) => item.id === "merge_closeout" && (item.status === "pending" || item.status === "hold" || item.status === "blocked"),
  );

  if (approvals.length === 0 && interventions.length === 0 && closeoutPoints.length === 0) {
    dom.inboxList.textContent = "Inbox is clear.";
    return;
  }

  for (const approval of approvals) {
    dom.inboxList.append(
      queueCard({
        title: `Approval · ${approval.id}`,
        subtitle: `${approval.topicId} · ${approval.gateType}`,
        note: approval.note,
        status: approval.status,
      }),
    );
  }

  for (const intervention of interventions) {
    dom.inboxList.append(
      queueCard({
        title: `Intervention · ${intervention.id}`,
        subtitle: `${intervention.type} · run ${intervention.runId}`,
        note: intervention.note,
        status: intervention.status,
      }),
    );
  }

  for (const point of closeoutPoints) {
    dom.inboxList.append(
      queueCard({
        title: `Closeout gate · ${point.name}`,
        subtitle: `${point.topicId} · owner ${point.owner}`,
        note: point.note,
        status: point.status,
      }),
    );
  }
}

function renderApprovalQueue(approvals) {
  dom.approvalList.replaceChildren();
  const pending = approvals.filter((item) => item.status === "pending");
  if (pending.length === 0) {
    dom.approvalList.textContent = "No pending approvals.";
    return;
  }
  for (const approval of pending) {
    const card = queueCard({
      title: `${approval.gateType} · ${approval.topicId}`,
      subtitle: `Run ${approval.runId} · requested by ${approval.requestedBy} · ${formatTime(approval.createdAt)}`,
      note: approval.note,
    });
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    actions.append(
      queueAction("Approve", async () => {
        await requestJson(ENDPOINTS.approvalDecision(approval.id), {
          method: "POST",
          body: { decision: "approve", operator: "shell-operator", note: "approved from collaboration shell" },
        });
        await loadAndRender();
      }),
      queueAction("Reject", async () => {
        await requestJson(ENDPOINTS.approvalDecision(approval.id), {
          method: "POST",
          body: { decision: "reject", operator: "shell-operator", note: "rejected from collaboration shell" },
        });
        await loadAndRender();
      }),
    );
    card.append(actions);
    dom.approvalList.append(card);
  }
}

function renderInterventionQueue(interventions) {
  dom.interventionList.replaceChildren();
  const pending = interventions.filter((item) => item.status === "pending");
  if (pending.length === 0) {
    dom.interventionList.textContent = "No pending interventions.";
    return;
  }
  for (const intervention of pending) {
    const card = queueCard({
      title: `${intervention.type} · ${intervention.topicId}`,
      subtitle: `Run ${intervention.runId} · requested by ${intervention.requestedBy} · ${formatTime(
        intervention.createdAt,
      )}`,
      note: intervention.note,
    });
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    for (const action of intervention.recommendedActions) {
      actions.append(
        queueAction(actionLabel(action), async () => {
          await requestJson(ENDPOINTS.interventionAction(intervention.id), {
            method: "POST",
            body: { action, operator: "shell-operator", note: "action from collaboration shell" },
          });
          await loadAndRender();
        }),
      );
    }
    card.append(actions);
    dom.interventionList.append(card);
  }
}

function renderCloseoutPoints(points) {
  dom.interventionPointsList.replaceChildren();
  const closeoutAndGates = points.filter((point) =>
    ["lead_plan", "worker_dispatch", "merge_closeout"].includes(point.id),
  );

  if (closeoutAndGates.length === 0) {
    dom.interventionPointsList.textContent = "No closeout gate actions.";
    return;
  }

  for (const point of closeoutAndGates) {
    const card = queueCard({
      title: `${point.name} · ${point.topicId}`,
      subtitle: `Owner ${point.owner} · state ${point.status}`,
      note: point.note,
      status: point.status,
    });
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    for (const action of point.allowedActions) {
      actions.append(
        queueAction(interventionPointActionLabel(action), async () => {
          await requestJson(ENDPOINTS.interventionPointAction(point.id), {
            method: "POST",
            body: { action, operator: "shell-operator", note: "gate action from collaboration shell" },
          });
          await loadAndRender();
        }),
      );
    }
    card.append(actions);
    dom.interventionPointsList.append(card);
  }
}

function renderEvents(events) {
  dom.eventFeed.replaceChildren();
  for (const event of events) {
    const row = document.createElement("li");
    row.className = event.severity;
    row.textContent = `${formatTime(event.at)} · ${event.topicId} · ${event.message}`;
    dom.eventFeed.append(row);
  }
}

function queueCard({ title, subtitle, note, status = "pending" }) {
  const wrapper = document.createElement("article");
  wrapper.className = "queue-card";

  const header = document.createElement("header");
  const titleNode = document.createElement("h3");
  titleNode.textContent = title;
  const badge = document.createElement("span");
  badge.className = `badge ${statusBadgeClass(status)}`;
  badge.textContent = status;
  header.append(titleNode, badge);

  const meta = document.createElement("p");
  meta.className = "queue-meta";
  meta.textContent = subtitle;

  const noteNode = document.createElement("p");
  noteNode.className = "queue-meta";
  noteNode.textContent = note;

  wrapper.append(header, meta, noteNode);
  return wrapper;
}

function queueAction(label, handler) {
  const fragment = dom.actionTemplate.content.cloneNode(true);
  const button = fragment.querySelector("button");
  button.textContent = label;
  button.addEventListener("click", () => {
    void withButtonDisabled(button, handler);
  });
  return button;
}

async function withButtonDisabled(button, action) {
  button.disabled = true;
  try {
    await action();
  } catch (error) {
    console.error(error);
  } finally {
    button.disabled = false;
  }
}

function statusCell(status) {
  const element = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${statusBadgeClass(status)}`;
  badge.textContent = status;
  element.append(badge);
  return element;
}

function statusBadgeClass(status) {
  if (status === "running" || status === "active" || status === "approved") {
    return "badge-running";
  }
  if (status === "blocked" || status === "approval_required" || status === "hold" || status === "rejected") {
    return "badge-blocked";
  }
  if (status === "pending" || status === "open" || status === "waiting") {
    return "badge-pending";
  }
  return "badge-idle";
}

function cell(text) {
  const element = document.createElement("td");
  element.textContent = text;
  return element;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function actionLabel(action) {
  switch (action) {
    case "pause":
      return "Pause run";
    case "resume":
      return "Resume run";
    case "reroute":
      return "Reroute plan";
    case "request_report":
      return "Request follow-up";
    default:
      return action;
  }
}

function interventionPointActionLabel(action) {
  switch (action) {
    case "approve":
      return "Approve gate";
    case "hold":
      return "Hold gate";
    case "escalate":
      return "Escalate";
    default:
      return action;
  }
}

async function requestJson(url, { method, body }) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${response.status}`);
  }
  return response.json();
}

function resolveRuntimeConfig() {
  const defaults = { apiBaseUrl: window.location.origin };
  const fromWindow = window.OPENSHOCK_SHELL_CONFIG;
  if (!fromWindow || typeof fromWindow !== "object") {
    return defaults;
  }
  if (!fromWindow.apiBaseUrl || typeof fromWindow.apiBaseUrl !== "string") {
    return defaults;
  }
  return { apiBaseUrl: fromWindow.apiBaseUrl };
}

function toApiUrl(baseUrl, pathname) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${pathname}`;
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}
