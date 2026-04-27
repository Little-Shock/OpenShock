import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const shellSourcePath = resolve(__dirname, "../components/open-shock-shell.tsx");

function source() {
  return readFileSync(shellSourcePath, "utf8");
}

test("shell rail surfaces collaboration rules from the selected room session or active session", () => {
  const shellSource = source();

  assert.match(shellSource, /buildWorkspaceRuleHighlights/);
  assert.match(shellSource, /const activeShellSession =/);
  assert.match(shellSource, /selectedRoomId \? resolvedState\.sessions\.find\(\(session\) => session\.roomId === selectedRoomId\)/);
  assert.match(shellSource, /data-testid="shell-rule-panel"/);
  assert.match(shellSource, /继续前先按这组规则。/);
  assert.match(shellSource, /data-testid=\{`shell-rule-\$\{item\.id\}`\}/);
});

test("entry shell trims global summary noise on setup and access views", () => {
  const shellSource = source();

  assert.match(shellSource, /const isEntryView = view === "setup" \|\| view === "access";/);
  assert.match(shellSource, /\{!isEntryView \? \(\s*<StitchSidebar/);
  assert.match(shellSource, /\{!isEntryView \? \(\s*<StitchTopBar/);
  assert.match(shellSource, /isEntryView \? "md:grid-cols-\[minmax\(0,1fr\)\]"/);
  assert.match(shellSource, /isEntryView \? "xl:grid-cols-\[minmax\(0,1fr\)\]"/);
  assert.match(shellSource, /\{!isEntryView \? \(/);
  assert.match(shellSource, /data-testid="shell-entry-next-panel"/);
  assert.match(shellSource, /\{isEntryView \? \(/);
});
