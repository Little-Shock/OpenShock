import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { findLatestLocalWalkthroughEvidence } from "./local-walkthrough-evidence-latest.mjs";
import pkg from "../package.json" with { type: "json" };

const SCRIPT_PATH = new URL("./local-walkthrough-evidence-latest.mjs", import.meta.url);

function makeTempRoot(prefix) {
  const root = path.join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(root, { recursive: true });
  return root;
}

function writeEvidenceFile(root, fileName, contents = "{}") {
  const evidenceDir = path.join(root, "output", "testing", "local-walkthrough");
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(path.join(evidenceDir, fileName), contents);
}

test("findLatestLocalWalkthroughEvidence locates route smoke, interaction smoke, and screenshots", () => {
  const root = makeTempRoot("openshock-local-walkthrough");
  try {
    writeEvidenceFile(root, "route-smoke.json", "[]");
    writeEvidenceFile(root, "interaction-smoke.json", "{\"ok\":true}");
    writeEvidenceFile(root, "home.png", "");
    writeEvidenceFile(root, "rooms.png", "");

    const result = findLatestLocalWalkthroughEvidence({ rootDir: root });

    assert.equal(result.ok, true);
    assert.equal(result.routeSmokePath, path.join("output", "testing", "local-walkthrough", "route-smoke.json"));
    assert.equal(result.interactionSmokePath, path.join("output", "testing", "local-walkthrough", "interaction-smoke.json"));
    assert.deepEqual(result.screenshots, [
      path.join("output", "testing", "local-walkthrough", "home.png"),
      path.join("output", "testing", "local-walkthrough", "rooms.png"),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("local walkthrough evidence CLI fails when required smoke JSON is missing", () => {
  const root = makeTempRoot("openshock-local-walkthrough-missing");
  try {
    writeEvidenceFile(root, "route-smoke.json", "[]");

    const result = spawnSync(process.execPath, [SCRIPT_PATH.pathname, "--root", root], {
      encoding: "utf8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /interaction-smoke\.json/);
    assert.match(result.stderr, /rerun the local route and interaction walkthrough smoke/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("package.json exposes the local walkthrough evidence locator command", () => {
  assert.equal(
    pkg.scripts["local-walkthrough:evidence"],
    "node ./scripts/local-walkthrough-evidence-latest.mjs"
  );
});
