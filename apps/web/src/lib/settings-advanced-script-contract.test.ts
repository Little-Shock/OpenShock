import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function scriptSource(name: string) {
  return readFileSync(resolve(__dirname, `../../../../scripts/${name}`), "utf8");
}

test("advanced settings headed walkthroughs target /settings/advanced for governance, credentials, and notifications", () => {
  assert.match(scriptSource("headed-configurable-team-topology.mjs"), /goto\(`\$\{webURL\}\/settings\/advanced`/);
  assert.match(scriptSource("headed-governed-mailbox-route.mjs"), /goto\(`\$\{webURL\}\/settings\/advanced`/);

  assert.match(scriptSource("headed-credential-profile-scope.mjs"), /goto\(`\$\{webURL\}\/settings\/advanced`/);
  assert.match(scriptSource("headed-credential-profile-scope.mjs"), /fetch\(`\$\{webURL\}\/settings\/advanced`\)/);

  assert.match(scriptSource("headed-identity-template-recovery-journey.mjs"), /goto\(`\$\{webURL\}\/settings\/advanced`/);
  assert.match(scriptSource("headed-notification-preference-delivery.mjs"), /goto\(`\$\{services\.webURL\}\/settings\/advanced`/);
  assert.match(scriptSource("headed-delivery-entry-release-gate.mjs"), /pathname === "\/settings\/advanced"/);
});
