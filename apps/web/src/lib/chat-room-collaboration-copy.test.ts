import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(__dirname, "../components/stitch-chat-room-views.tsx");

function source() {
  return readFileSync(sourcePath, "utf8");
}

test("chat and room first surfaces say users can collaborate with AI agents", () => {
  const content = source();

  assert.match(content, /在频道里和 AI 智能体协作。/);
  assert.match(content, /在私聊里和 AI 智能体协作。/);
  assert.match(content, /在讨论间里和 AI 智能体协作推进事项。/);
});
