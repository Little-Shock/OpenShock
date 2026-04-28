import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const roomsSourcePath = resolve(__dirname, "../components/live-detail-views.tsx");
const roomsScriptPath = resolve(__dirname, "../../../../scripts/headed-rooms-continue-entry.mjs");

function source(path: string) {
  return readFileSync(path, "utf8");
}

function extractFunctionBlock(sourceText: string, functionName: string) {
  const start = sourceText.indexOf(`function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} should exist`);
  const nextFunction = sourceText.indexOf("\nfunction ", start + 1);
  assert.notEqual(nextFunction, -1, `${functionName} should be followed by another function`);
  return sourceText.slice(start, nextFunction);
}

test("rooms first screen exposes stable continue-entry anchors", () => {
  const roomsSource = source(roomsSourcePath);

  assert.match(roomsSource, /data-testid="rooms-continue-card"/);
  assert.match(roomsSource, /data-testid="rooms-continue-cta"/);
  assert.match(roomsSource, /continueRoom\.title/);
  assert.match(roomsSource, /data-testid=\{`room-snapshot-card-\$\{room\.id\}`\}/);
  assert.match(roomsSource, /data-testid=\{`room-snapshot-primary-cta-\$\{room\.id\}`\}/);
  assert.match(roomsSource, /data-testid=\{`room-snapshot-compact-facts-\$\{room\.id\}`\}/);
});

test("rooms snapshot cards do not repeat continue summary fallback copy", () => {
  const roomsSource = source(roomsSourcePath);
  const snapshotCardSource = extractFunctionBlock(roomsSource, "RoomSnapshotCard");

  assert.doesNotMatch(snapshotCardSource, /room\.summary/);
  assert.doesNotMatch(snapshotCardSource, /room\.topic\.summary/);
  assert.match(snapshotCardSource, /room\.topic\.title/);
  assert.match(snapshotCardSource, /room\.topic\.owner/);
  assert.match(snapshotCardSource, /room-snapshot-primary-cta/);
});

test("rooms continue headed replay covers the blocked-room priority path", () => {
  const scriptSource = source(roomsScriptPath);

  assert.match(scriptSource, /\/rooms/);
  assert.match(scriptSource, /rooms-continue-card/);
  assert.match(scriptSource, /rooms-continue-cta/);
  assert.match(scriptSource, /assertRoomSnapshotsStayCompact/);
  assert.match(scriptSource, /repeated room summary/);
  assert.match(scriptSource, /repeated topic summary/);
  assert.match(scriptSource, /room-snapshot-card-room-memory/);
  assert.match(scriptSource, /记忆写回讨论间/);
  assert.match(scriptSource, /阻塞 \/ 暂停优先/);
  assert.match(scriptSource, /执行详情/);
  assert.match(scriptSource, /room-header-primary-next-link/);
  assert.match(scriptSource, /\/runs\/run_memory_01/);
});
