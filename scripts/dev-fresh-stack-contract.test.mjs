import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("fresh stack configures local shared secrets for server and daemon", () => {
  const script = source("scripts/dev-fresh-stack.mjs");

  assert.match(script, /import \{ randomUUID \} from "node:crypto";/);
  assert.match(script, /internalWorkerValue: `fresh-worker-\$\{randomUUID\(\)\}`/);
  assert.match(script, /runtimeHeartbeatValue: `fresh-heartbeat-\$\{randomUUID\(\)\}`/);
  assert.match(script, /OPENSHOCK_INTERNAL_WORKER_SECRET: secrets\.internalWorkerValue/);
  assert.match(script, /OPENSHOCK_RUNTIME_HEARTBEAT_SECRET: secrets\.runtimeHeartbeatValue/);
  assert.match(script, /OPENSHOCK_RUNTIME_HEARTBEAT_SECRET: secrets\.runtimeHeartbeatValue/);
  assert.match(script, /internalWorkerConfigured: true/);
  assert.match(script, /runtimeHeartbeatConfigured: true/);
  assert.match(script, /"next", "dev", "--webpack", "--hostname", "127\.0\.0\.1"/);
  assert.match(script, /Local security baseline: internal worker secret and runtime heartbeat secret are configured\./);
  assert.match(script, /Internal worker secret configured: \$\{metadata\.security\?\.internalWorkerConfigured \? "yes" : "no"\}/);
  assert.match(script, /Runtime heartbeat secret configured: \$\{metadata\.security\?\.runtimeHeartbeatConfigured \? "yes" : "no"\}/);
  assert.match(script, /让人和智能体在同一条对话里继续工作/);
  assert.match(script, /home-primary-chat-cta/);
});
