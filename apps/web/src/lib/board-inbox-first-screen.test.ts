import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(__dirname, "../components/stitch-board-inbox-views.tsx");

function source() {
  return readFileSync(sourcePath, "utf8");
}

test("board first screen keeps board as a supporting flow", () => {
  const content = source();

  assert.match(content, /description="这里只看优先级和推进状态，真正动手仍在讨论间。"/);
  assert.match(content, /<h3 className="mt-2 font-display text-\[24px\] font-bold leading-none">起一条新事项<\/h3>/);
  assert.match(content, /这里只登记事项，具体推进回讨论间。/);
  assert.match(content, /创建后进入讨论间/);
  assert.match(content, /data-testid="board-mobile-create-details"/);
  assert.match(content, /data-testid="board-mobile-create-issue-submit"/);
  assert.match(content, /xl:hidden/);
});

test("board cards keep planning compact and route back to discussion", () => {
  const content = source();

  assert.match(content, /data-testid=\{`board-card-title-\$\{card\.key\}`\}/);
  assert.match(content, /data-testid=\{`board-card-planning-state-\$\{card\.key\}`\}/);
  assert.match(content, /规划状态 \{boardStateLabel\(card\.state\)\}/);
  assert.match(content, /data-testid=\{`board-card-owner-\$\{card\.key\}`\}/);
  assert.match(content, /data-testid=\{`board-card-room-\$\{card\.key\}`\}/);
  assert.match(content, /href=\{`\/rooms\/\$\{card\.roomId\}\?tab=context`\}/);
  assert.match(content, /回讨论间/);
  assert.doesNotMatch(content, /\{card\.summary\}/);
});

test("inbox first screen keeps inbox as a supporting flow", () => {
  const content = source();

  assert.match(content, /: "只处理提醒，处理完回讨论间。"/);
  assert.match(content, /mailboxSurfaceActive \? "先处理交接" : "先看当前提醒"/);
  assert.match(content, /: "只处理当前提醒。"/);
  assert.match(content, /处理完就回讨论间。通知规则在设置里。/);
  assert.doesNotMatch(content, /待拍板提醒/);
});
