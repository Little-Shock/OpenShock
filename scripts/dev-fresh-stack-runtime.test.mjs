import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");
const scriptPath = path.join(projectRoot, "scripts", "dev-fresh-stack.mjs");

function runFreshStack(args, envOverrides = {}, timeout = 240000) {
  return spawnSync("node", [scriptPath, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

test("fresh stack start -> status -> stop works as a runtime smoke", () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), "openshock-fresh-stack-"));
  const env = {
    OPENSHOCK_FRESH_WORKSPACE_ROOT: workspaceRoot,
  };

  try {
    const start = runFreshStack(["start", "--no-open"], env);
    assert.equal(start.status, 0, `fresh stack start failed\nstdout:\n${start.stdout}\nstderr:\n${start.stderr}`);
    assert.match(start.stdout, /OpenShock fresh stack is ready\./);
    assert.match(start.stdout, /Entry: http:\/\/127\.0\.0\.1:\d+/);
    assert.match(start.stdout, /Local security baseline: internal worker secret and runtime heartbeat secret are configured\./);

    const status = runFreshStack(["status"], env, 60000);
    assert.equal(status.status, 0, `fresh stack status failed\nstdout:\n${status.stdout}\nstderr:\n${status.stderr}`);
    assert.match(status.stdout, /OpenShock fresh stack status/);
    assert.match(status.stdout, /Status: ready/);
    assert.match(status.stdout, /Internal worker secret configured: yes/);
    assert.match(status.stdout, /Runtime heartbeat secret configured: yes/);

    const stop = runFreshStack(["stop"], env, 120000);
    assert.equal(stop.status, 0, `fresh stack stop failed\nstdout:\n${stop.stdout}\nstderr:\n${stop.stderr}`);
    assert.match(stop.stdout, /OpenShock fresh stack stopped\./);

    const finalStatus = runFreshStack(["status"], env, 60000);
    assert.equal(finalStatus.status, 0, `fresh stack final status failed\nstdout:\n${finalStatus.stdout}\nstderr:\n${finalStatus.stderr}`);
    assert.match(finalStatus.stdout, /OpenShock fresh stack is not running\./);
  } finally {
    runFreshStack(["stop"], env, 120000);
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});
