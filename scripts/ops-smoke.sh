#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LIVE_SERVER_METADATA="${OPENSHOCK_LIVE_SERVER_METADATA:-${PROJECT_ROOT}/data/ops/live-server.json}"

discover_managed_live_server_url() {
  local metadata_path="$1"

  if [[ ! -f "$metadata_path" ]]; then
    return 1
  fi

  OPENSHOCK_METADATA_FILE="$metadata_path" node <<'NODE'
const fs = require("node:fs")

try {
  const payload = JSON.parse(fs.readFileSync(process.env.OPENSHOCK_METADATA_FILE || "", "utf8") || "{}")
  const baseUrl = String(payload.baseUrl || "").trim().replace(/\/+$/, "")
  const managed = payload.managed
  const status = String(payload.status || "").trim()

  if (managed === false || status !== "running" || !baseUrl) {
    process.exit(1)
  }

  process.stdout.write(baseUrl)
} catch {
  process.exit(1)
}
NODE
}

SERVER_URL="${OPENSHOCK_SERVER_URL:-}"
if [[ -z "$SERVER_URL" ]]; then
  if discovered_server_url="$(discover_managed_live_server_url "$LIVE_SERVER_METADATA")"; then
    SERVER_URL="$discovered_server_url"
  else
    SERVER_URL="http://127.0.0.1:8080"
  fi
fi

DAEMON_URL="${OPENSHOCK_DAEMON_URL:-http://127.0.0.1:8090}"
CURL_MAX_TIME="${OPENSHOCK_CURL_MAX_TIME:-10}"
REQUIRE_GITHUB_READY="${OPENSHOCK_REQUIRE_GITHUB_READY:-0}"
REQUIRE_BRANCH_HEAD_ALIGNED="${OPENSHOCK_REQUIRE_BRANCH_HEAD_ALIGNED:-0}"
ACTUAL_LIVE_URL="${OPENSHOCK_ACTUAL_LIVE_URL:-}"
REQUIRE_ACTUAL_LIVE_PARITY="${OPENSHOCK_REQUIRE_ACTUAL_LIVE_PARITY:-0}"

last_status=""
last_body=""

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 1
  fi
}

preview_body() {
  local body="$1"
  body="${body//$'\n'/ }"
  printf '%s\n' "${body:0:200}"
}

request_json_with_method() {
  local method="$1"
  local url="$2"
  local payload="${3:-}"
  local body_file

  body_file="$(mktemp)"
  trap 'rm -f "$body_file"' RETURN
  if [[ -n "$payload" ]]; then
    last_status="$(curl -sS --max-time "$CURL_MAX_TIME" -X "$method" -H 'Content-Type: application/json' -o "$body_file" -w '%{http_code}' --data "$payload" "$url")"
  else
    last_status="$(curl -sS --max-time "$CURL_MAX_TIME" -X "$method" -o "$body_file" -w '%{http_code}' "$url")"
  fi
  last_body="$(cat "$body_file")"
  rm -f "$body_file"
  trap - RETURN
}

request_json() {
  request_json_with_method "GET" "$1"
}

assert_status() {
  local expected="$1"
  local label="$2"

  if [[ "$last_status" != "$expected" ]]; then
    echo "$label returned status $last_status, want $expected" >&2
    preview_body "$last_body" >&2
    exit 1
  fi
}

assert_contains() {
  local needle="$1"
  local label="$2"

  if [[ "$last_body" != *"$needle"* ]]; then
    echo "$label missing marker $needle" >&2
    preview_body "$last_body" >&2
    exit 1
  fi
}

probe() {
  local label="$1"
  local url="$2"
  local needle="$3"

  echo "==> $label"
  request_json "$url"
  assert_status "200" "$label"
  assert_contains "$needle" "$label"
  preview_body "$last_body"
}

normalize_url() {
  local value="$1"
  while [[ "$value" == */ ]]; do
    value="${value%/}"
  done
  printf '%s\n' "$value"
}

assert_runtime_pairing_truth() {
  local pairing_body="$1"
  local registry_body="$2"
  local runtime_body="$3"
  local daemon_body="$4"

  PAIRING_BODY="$pairing_body" \
  REGISTRY_BODY="$registry_body" \
  RUNTIME_BODY="$runtime_body" \
  DAEMON_BODY="$daemon_body" \
  EXPECTED_DAEMON_URL="$(normalize_url "$DAEMON_URL")" \
    node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const normalize = (value) => String(value ?? "").trim().replace(/\/+$/, "")
const parse = (name) => {
  try {
    return JSON.parse(process.env[name] || "{}")
  } catch (error) {
    fail(`${name} invalid json: ${error.message}`)
  }
}

const expectedDaemonURL = normalize(process.env.EXPECTED_DAEMON_URL)
const pairing = parse("PAIRING_BODY")
const registry = parse("REGISTRY_BODY")
const runtime = parse("RUNTIME_BODY")
const daemon = parse("DAEMON_BODY")

const pairingURL = normalize(pairing.daemonUrl)
if (!pairingURL) {
  fail("Server runtime pairing missing daemonUrl")
}
if (pairingURL !== expectedDaemonURL) {
  fail(`Server runtime pairing daemonUrl mismatch: got ${pairingURL}, want ${expectedDaemonURL}`)
}

const runtimeURL = normalize(runtime.daemonUrl)
if (!runtimeURL) {
  fail("Server runtime snapshot missing daemonUrl")
}
if (runtimeURL !== expectedDaemonURL) {
  fail(`Server runtime snapshot daemonUrl mismatch: got ${runtimeURL}, want ${expectedDaemonURL}`)
}

const daemonURL = normalize(daemon.daemonUrl)
if (!daemonURL) {
  fail("Daemon runtime missing daemonUrl")
}
if (daemonURL !== expectedDaemonURL) {
  fail(`Daemon runtime daemonUrl mismatch: got ${daemonURL}, want ${expectedDaemonURL}`)
}

const pairedRuntime = String(registry.pairedRuntime || "").trim()
const runtimes = Array.isArray(registry.runtimes) ? registry.runtimes : []
if (!pairedRuntime) {
  fail("Server runtime registry missing pairedRuntime")
}
const pairedRecord = runtimes.find((item) => {
  const id = String(item?.id || "").trim()
  const machine = String(item?.machine || "").trim()
  return id === pairedRuntime || machine === pairedRuntime
})
if (!pairedRecord) {
  fail(`Server runtime registry missing paired runtime ${pairedRuntime}`)
}
const registryURL = normalize(pairedRecord.daemonUrl)
if (!registryURL) {
  fail(`Server runtime registry paired runtime ${pairedRuntime} missing daemonUrl`)
}
if (registryURL !== expectedDaemonURL) {
  fail(`Server runtime registry paired daemonUrl mismatch: got ${registryURL}, want ${expectedDaemonURL}`)
}
NODE
}

assert_usage_observability_truth() {
  local state_body="$1"
  local state_file

  state_file="$(mktemp)"
  trap 'rm -f "$state_file"' RETURN
  printf '%s' "$state_body" >"$state_file"

  STATE_BODY_FILE="$state_file" node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const fs = require("node:fs")

let state
try {
  state = JSON.parse(fs.readFileSync(process.env.STATE_BODY_FILE || "", "utf8") || "{}")
} catch (error) {
  fail(`STATE_BODY_FILE invalid json: ${error.message}`)
}

const workspace = state.workspace || {}
const quota = workspace.quota || {}
const usage = workspace.usage || {}
if (!(quota.maxAgents > 0) || !(quota.messageHistoryDays > 0)) {
  fail("Server state missing workspace quota observability truth")
}
if (!Number.isFinite(usage.totalTokens) || !Number.isFinite(usage.messageCount)) {
  fail("Server state missing workspace usage observability truth")
}

const runs = Array.isArray(state.runs) ? state.runs : []
if (!runs[0] || !runs[0].usage || !Number.isFinite(runs[0].usage.totalTokens)) {
  fail("Server state missing run usage truth")
}
NODE

  rm -f "$state_file"
  trap - RETURN
}

assert_state_runtime_truth() {
  local state_body="$1"
  local state_file

  state_file="$(mktemp)"
  trap 'rm -f "$state_file"' RETURN
  printf '%s' "$state_body" >"$state_file"

  STATE_BODY_FILE="$state_file" \
  EXPECTED_DAEMON_URL="$(normalize_url "$DAEMON_URL")" \
    node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const fs = require("node:fs")

const normalize = (value) => String(value ?? "").trim().replace(/\/+$/, "")

let state
try {
  state = JSON.parse(fs.readFileSync(process.env.STATE_BODY_FILE || "", "utf8") || "{}")
} catch (error) {
  fail(`STATE_BODY_FILE invalid json: ${error.message}`)
}

const expectedDaemonURL = normalize(process.env.EXPECTED_DAEMON_URL)
const workspace = state.workspace || {}
const pairedRuntime = String(workspace.pairedRuntime || "").trim()
if (!pairedRuntime) {
  fail("Server state missing workspace pairedRuntime")
}
if (String(workspace.pairingStatus || "").trim() !== "paired") {
  fail(`Server state pairingStatus = ${workspace.pairingStatus || ""}, want paired`)
}
const workspaceDaemonURL = normalize(workspace.pairedRuntimeUrl)
if (!workspaceDaemonURL) {
  fail("Server state missing workspace pairedRuntimeUrl")
}
if (workspaceDaemonURL !== expectedDaemonURL) {
  fail(`Server state pairedRuntimeUrl mismatch: got ${workspaceDaemonURL}, want ${expectedDaemonURL}`)
}

const runtimes = Array.isArray(state.runtimes) ? state.runtimes : []
const pairedRecord = runtimes.find((item) => {
  const id = String(item?.id || "").trim()
  const machine = String(item?.machine || "").trim()
  return id === pairedRuntime || machine === pairedRuntime
})
if (!pairedRecord) {
  fail(`Server state missing paired runtime record ${pairedRuntime}`)
}
const runtimeDaemonURL = normalize(pairedRecord.daemonUrl)
if (!runtimeDaemonURL) {
  fail(`Server state paired runtime ${pairedRuntime} missing daemonUrl`)
}
if (runtimeDaemonURL !== expectedDaemonURL) {
  fail(`Server state paired runtime daemonUrl mismatch: got ${runtimeDaemonURL}, want ${expectedDaemonURL}`)
}
const runtimeState = String(pairedRecord.state || "").trim().toLowerCase()
if (runtimeState === "offline" || runtimeState === "stale") {
  fail(`Server state paired runtime ${pairedRuntime} is not live: ${pairedRecord.state || ""}`)
}
NODE

  rm -f "$state_file"
  trap - RETURN
}

assert_experience_metrics_truth() {
  local body="$1"
  local body_file

  body_file="$(mktemp)"
  trap 'rm -f "$body_file"' RETURN
  printf '%s' "$body" >"$body_file"

  EXPERIENCE_BODY_FILE="$body_file" node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const fs = require("node:fs")

let snapshot
try {
  snapshot = JSON.parse(fs.readFileSync(process.env.EXPERIENCE_BODY_FILE || "", "utf8") || "{}")
} catch (error) {
  fail(`EXPERIENCE_BODY_FILE invalid json: ${error.message}`)
}

if (!Array.isArray(snapshot.sections) || snapshot.sections.length === 0) {
  fail("Experience metrics missing sections")
}
if (!snapshot.summary || !snapshot.workspace || !snapshot.methodology) {
  fail("Experience metrics missing summary fields")
}
NODE

  rm -f "$body_file"
  trap - RETURN
}

assert_repo_binding_truth() {
  local body="$1"
  local body_file

  body_file="$(mktemp)"
  trap 'rm -f "$body_file"' RETURN
  printf '%s' "$body" >"$body_file"

  REPO_BINDING_BODY_FILE="$body_file" node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const fs = require("node:fs")

let binding
try {
  binding = JSON.parse(fs.readFileSync(process.env.REPO_BINDING_BODY_FILE || "", "utf8") || "{}")
} catch (error) {
  fail(`REPO_BINDING_BODY_FILE invalid json: ${error.message}`)
}

const bindingStatus = String(binding.bindingStatus || "").trim().toLowerCase()
if (bindingStatus !== "bound") {
  fail(`Repo binding not bound: bindingStatus=${String(binding.bindingStatus || "")}`)
}

for (const field of ["repo", "repoUrl", "branch", "provider"]) {
  if (!String(binding[field] || "").trim()) {
    fail(`Repo binding missing ${field}`)
  }
}

const authModes = [binding.authMode, binding.preferredAuthMode]
  .map((value) => String(value || "").trim().toLowerCase())
  .filter(Boolean)
if (authModes.includes("github-app")) {
  if (binding.connectionReady !== true) {
    fail(`Repo binding github-app mode not ready: connectionReady=${String(binding.connectionReady)}`)
  }
  if (binding.appInstalled !== true) {
    fail(`Repo binding github-app mode missing installation: appInstalled=${String(binding.appInstalled)}`)
  }
}
NODE

  rm -f "$body_file"
  trap - RETURN
}

assert_branch_head_truth() {
  local body="$1"
  local body_file

  body_file="$(mktemp)"
  trap 'rm -f "$body_file"' RETURN
  printf '%s' "$body" >"$body_file"

  BRANCH_HEAD_BODY_FILE="$body_file" node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const fs = require("node:fs")

let snapshot
try {
  snapshot = JSON.parse(fs.readFileSync(process.env.BRANCH_HEAD_BODY_FILE || "", "utf8") || "{}")
} catch (error) {
  fail(`BRANCH_HEAD_BODY_FILE invalid json: ${error.message}`)
}

if (String(snapshot.status || "").trim() !== "aligned") {
  fail(`Branch head truth not aligned: status=${String(snapshot.status || "")} summary=${String(snapshot.summary || "")}`)
}
if (!Array.isArray(snapshot.drifts)) {
  fail("Branch head truth missing drifts array")
}
if (snapshot.drifts.length !== 0) {
  fail(`Branch head truth has drift entries: count=${snapshot.drifts.length}`)
}

const binding = snapshot.repoBinding || {}
if (String(binding.bindingStatus || "").trim().toLowerCase() !== "bound") {
  fail(`Branch head truth repo binding not bound: bindingStatus=${String(binding.bindingStatus || "")}`)
}
for (const field of ["repo", "repoUrl", "branch", "provider"]) {
  if (!String(binding[field] || "").trim()) {
    fail(`Branch head truth repo binding missing ${field}`)
  }
}

const checkout = snapshot.checkout || {}
if (String(checkout.status || "").trim() !== "ready") {
  fail(`Branch head truth checkout not ready: status=${String(checkout.status || "")}`)
}
NODE

  rm -f "$body_file"
  trap - RETURN
}

probe_state_stream_snapshot() {
  echo "==> Server state stream"
  STATE_STREAM_URL="$SERVER_URL/v1/state/stream" \
  OPENSHOCK_STREAM_TIMEOUT_MS="${OPENSHOCK_STREAM_TIMEOUT_MS:-2500}" \
    node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

;(async () => {
  const url = process.env.STATE_STREAM_URL
  const timeoutMs = Number(process.env.OPENSHOCK_STREAM_TIMEOUT_MS || "2500")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    })
    if (!response.ok) {
      fail(`Server state stream returned status ${response.status}`)
    }
    if (!response.body) {
      fail("Server state stream missing response body")
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let body = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }
      body += decoder.decode(value, { stream: true })
      if (body.includes("event: snapshot") && body.includes('"workspace"')) {
        const compact = body.replace(/\s+/g, " ").trim()
        console.log(compact.slice(0, 200))
        clearTimeout(timer)
        controller.abort()
        process.exit(0)
      }
    }

    fail("Server state stream missing snapshot payload")
  } catch (error) {
    if (error && error.name === "AbortError") {
      fail("Server state stream timed out before snapshot arrived")
    }
    fail(`Server state stream probe failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timer)
  }
})()
NODE
}

probe_github_connection() {
  local url="$1"

  echo "==> GitHub connection"
  request_json "$url"
  assert_status "200" "GitHub connection"
  assert_contains '"ready":' "GitHub connection"
  if [[ "$REQUIRE_GITHUB_READY" == "1" ]]; then
    GITHUB_CONNECTION_BODY="$last_body" node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

let connection
try {
  connection = JSON.parse(process.env.GITHUB_CONNECTION_BODY || "{}")
} catch (error) {
  fail(`GitHub connection invalid json: ${error.message}`)
}

if (connection.ready !== true) {
  fail(`GitHub connection not ready for strict release gate: ready=${String(connection.ready)}`)
}
NODE
  fi
  preview_body "$last_body"
}

probe_branch_head_truth() {
  local url="$1"

  echo "==> Branch head truth"
  request_json "$url"
  assert_status "200" "Branch head truth"
  assert_contains '"status"' "Branch head truth"
  assert_contains '"summary"' "Branch head truth"
  assert_contains '"repoBinding"' "Branch head truth"
  assert_contains '"githubConnection"' "Branch head truth"
  assert_contains '"drifts"' "Branch head truth"
  preview_body "$last_body"
}

probe_run_control_fail_closed() {
  echo "==> Server run control fail-closed"
  request_json_with_method "POST" "$SERVER_URL/v1/runs/__ops_smoke_missing_run__/control" '{"action":"resume","note":"ops smoke fail-closed probe"}'
  assert_status "404" "Server run control fail-closed"
  assert_contains '"error"' "Server run control fail-closed"
  assert_contains 'run not found' "Server run control fail-closed"
  preview_body "$last_body"
}

probe_runtime_bridge_check() {
  echo "==> Server runtime bridge check"
  request_json_with_method "POST" "$SERVER_URL/v1/runtime/bridge-check" '{}'
  assert_status "200" "Server runtime bridge check"
  assert_contains '"command"' "Server runtime bridge check"
  assert_contains 'bridge-check' "Server runtime bridge check"
  assert_contains '"output"' "Server runtime bridge check"
  preview_body "$last_body"
}

assert_actual_live_parity_truth() {
  local live_service_body="$1"
  local parity_body="$2"

  LIVE_SERVICE_BODY="$live_service_body" \
  PARITY_BODY="$parity_body" \
  EXPECTED_ACTUAL_LIVE_URL="$(normalize_url "$ACTUAL_LIVE_URL")" \
    node <<'NODE'
const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const normalize = (value) => String(value ?? "").trim().replace(/\/+$/, "")
const parse = (name) => {
  try {
    return JSON.parse(process.env[name] || "{}")
  } catch (error) {
    fail(`${name} invalid json: ${error.message}`)
  }
}

const liveService = parse("LIVE_SERVICE_BODY")
const parity = parse("PARITY_BODY")
const expectedActualLiveURL = normalize(process.env.EXPECTED_ACTUAL_LIVE_URL)
const targetBaseURL = normalize(parity.targetBaseUrl)

if (liveService.managed !== true) {
  fail(`Actual live service is not managed: managed=${String(liveService.managed)} status=${String(liveService.status || "")}`)
}
if (String(parity.status || "").trim() !== "aligned") {
  fail(`Actual live rollout parity drifted: status=${String(parity.status || "")} summary=${String(parity.summary || "")}`)
}
if (!targetBaseURL) {
  fail("Actual live rollout parity missing targetBaseUrl")
}
if (targetBaseURL !== expectedActualLiveURL) {
  fail(`Actual live rollout target mismatch: got ${targetBaseURL}, want ${expectedActualLiveURL}`)
}
NODE
}

probe_actual_live_rollout() {
  if [[ -z "$ACTUAL_LIVE_URL" && "$REQUIRE_ACTUAL_LIVE_PARITY" != "1" ]]; then
    return
  fi

  if [[ -z "$ACTUAL_LIVE_URL" && "$REQUIRE_ACTUAL_LIVE_PARITY" == "1" ]]; then
    echo "OPENSHOCK_ACTUAL_LIVE_URL is required when OPENSHOCK_REQUIRE_ACTUAL_LIVE_PARITY=1" >&2
    exit 1
  fi

  echo "==> Current live service ownership"
  request_json "$SERVER_URL/v1/runtime/live-service"
  assert_status "200" "Current live service ownership"
  assert_contains '"managed"' "Current live service ownership"
  live_service_body="$last_body"
  preview_body "$live_service_body"

  echo "==> Actual live rollout parity"
  request_json "$SERVER_URL/v1/workspace/live-rollout-parity"
  assert_status "200" "Actual live rollout parity"
  assert_contains '"status"' "Actual live rollout parity"
  parity_body="$last_body"
  preview_body "$parity_body"

  if [[ "$REQUIRE_ACTUAL_LIVE_PARITY" == "1" ]]; then
    assert_actual_live_parity_truth "$live_service_body" "$parity_body"
  fi
}

require_cmd curl
require_cmd node

probe "Server healthz" "$SERVER_URL/healthz" '"service":"openshock-server"'
probe "Daemon healthz" "$DAEMON_URL/healthz" '"service":"openshock-daemon"'
echo "==> Server state"
request_json "$SERVER_URL/v1/state"
assert_status "200" "Server state"
assert_contains '"workspace"' "Server state"
state_body="$last_body"
preview_body "$state_body"
assert_usage_observability_truth "$state_body"
assert_state_runtime_truth "$state_body"
probe_state_stream_snapshot
echo "==> Server experience metrics"
request_json "$SERVER_URL/v1/experience-metrics"
assert_status "200" "Server experience metrics"
assert_contains '"sections"' "Server experience metrics"
experience_body="$last_body"
preview_body "$experience_body"
assert_experience_metrics_truth "$experience_body"
echo "==> Server repo binding"
request_json "$SERVER_URL/v1/repo/binding"
assert_status "200" "Server repo binding"
assert_contains '"bindingStatus"' "Server repo binding"
repo_binding_body="$last_body"
preview_body "$repo_binding_body"
assert_repo_binding_truth "$repo_binding_body"
probe_github_connection "$SERVER_URL/v1/github/connection"
echo "==> Branch head truth"
request_json "$SERVER_URL/v1/workspace/branch-head-truth"
assert_status "200" "Branch head truth"
assert_contains '"status"' "Branch head truth"
assert_contains '"summary"' "Branch head truth"
assert_contains '"repoBinding"' "Branch head truth"
assert_contains '"githubConnection"' "Branch head truth"
assert_contains '"drifts"' "Branch head truth"
branch_head_body="$last_body"
preview_body "$branch_head_body"
if [[ "$REQUIRE_BRANCH_HEAD_ALIGNED" == "1" ]]; then
  assert_branch_head_truth "$branch_head_body"
fi
probe_run_control_fail_closed
probe_runtime_bridge_check
probe_actual_live_rollout

echo "==> Server runtime registry"
request_json "$SERVER_URL/v1/runtime/registry"
assert_status "200" "Server runtime registry"
assert_contains '"runtimes"' "Server runtime registry"
registry_body="$last_body"
preview_body "$registry_body"

echo "==> Server runtime pairing"
request_json "$SERVER_URL/v1/runtime/pairing"
assert_status "200" "Server runtime pairing"
assert_contains '"pairingStatus"' "Server runtime pairing"
pairing_body="$last_body"
preview_body "$pairing_body"

echo "==> Server runtime bridge"
request_json "$SERVER_URL/v1/runtime"
assert_status "200" "Server runtime bridge"
assert_contains '"daemonUrl"' "Server runtime bridge"
runtime_body="$last_body"
preview_body "$runtime_body"

echo "==> Daemon runtime"
request_json "$DAEMON_URL/v1/runtime"
assert_status "200" "Daemon runtime"
assert_contains '"providers"' "Daemon runtime"
daemon_body="$last_body"
preview_body "$daemon_body"

assert_runtime_pairing_truth "$pairing_body" "$registry_body" "$runtime_body" "$daemon_body"

echo "ops smoke passed"
