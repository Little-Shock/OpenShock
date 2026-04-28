import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, "..");
const EVIDENCE_DIR = path.join("output", "testing", "local-walkthrough");
const REQUIRED_FILES = ["route-smoke.json", "interaction-smoke.json"];
const SCREENSHOT_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function projectRoot(rootDir) {
  return path.resolve(rootDir || process.env.OPENSHOCK_LOCAL_WALKTHROUGH_ROOT || DEFAULT_ROOT);
}

function relativeToRoot(root, absolutePath) {
  return path.relative(root, absolutePath) || ".";
}

function listScreenshots(evidenceAbsolutePath, root) {
  if (!existsSync(evidenceAbsolutePath)) {
    return [];
  }

  return readdirSync(evidenceAbsolutePath)
    .filter((entry) => SCREENSHOT_EXTENSIONS.has(path.extname(entry).toLowerCase()))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => path.join(EVIDENCE_DIR, entry))
    .map((relativePath) => relativeToRoot(root, path.join(root, relativePath)));
}

export function findLatestLocalWalkthroughEvidence(options = {}) {
  const root = projectRoot(options.rootDir);
  const evidenceAbsolutePath = path.join(root, EVIDENCE_DIR);
  const missing = [];

  if (!existsSync(evidenceAbsolutePath)) {
    missing.push(EVIDENCE_DIR);
  }

  const files = Object.fromEntries(
    REQUIRED_FILES.map((fileName) => {
      const absolutePath = path.join(evidenceAbsolutePath, fileName);
      if (!existsSync(absolutePath)) {
        missing.push(path.join(EVIDENCE_DIR, fileName));
      }
      return [
        fileName,
        {
          path: path.join(EVIDENCE_DIR, fileName),
          absolutePath,
          exists: existsSync(absolutePath),
        },
      ];
    })
  );

  const mtimeMs = existsSync(evidenceAbsolutePath) ? statSync(evidenceAbsolutePath).mtimeMs : 0;

  return {
    evidenceDir: EVIDENCE_DIR,
    evidenceAbsolutePath,
    evidenceDirExists: existsSync(evidenceAbsolutePath),
    routeSmokePath: files["route-smoke.json"].path,
    routeSmokeAbsolutePath: files["route-smoke.json"].absolutePath,
    interactionSmokePath: files["interaction-smoke.json"].path,
    interactionSmokeAbsolutePath: files["interaction-smoke.json"].absolutePath,
    screenshots: listScreenshots(evidenceAbsolutePath, root),
    missing,
    ok: missing.length === 0,
    updatedAt: mtimeMs > 0 ? new Date(mtimeMs).toISOString() : null,
  };
}

function usage() {
  return "usage: node ./scripts/local-walkthrough-evidence-latest.mjs [--json] [--root <repo-root>]";
}

function parseArgs(argv) {
  let json = false;
  let rootDir = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--root") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(usage());
      }
      rootDir = next;
      index += 1;
      continue;
    }
    throw new Error(usage());
  }

  return { json, rootDir };
}

function formatHumanReadable(result) {
  const lines = [
    "latest local walkthrough evidence",
    `directory: ${result.evidenceDir}${result.evidenceDirExists ? "" : " (missing)"}`,
    `route smoke: ${result.routeSmokePath}${existsSync(result.routeSmokeAbsolutePath) ? "" : " (missing)"}`,
    `interaction smoke: ${result.interactionSmokePath}${existsSync(result.interactionSmokeAbsolutePath) ? "" : " (missing)"}`,
    `screenshots: ${result.screenshots.length}`,
  ];

  for (const screenshot of result.screenshots) {
    lines.push(`- ${screenshot}`);
  }

  if (result.updatedAt) {
    lines.push(`updated: ${result.updatedAt}`);
  }

  if (!result.ok) {
    lines.push(`missing: ${result.missing.join(", ")}`);
    lines.push("next: rerun the local route and interaction walkthrough smoke");
  }

  return lines.join("\n");
}

function runCli() {
  const { json, rootDir } = parseArgs(process.argv.slice(2));
  const result = findLatestLocalWalkthroughEvidence({ rootDir });

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const output = formatHumanReadable(result);
    if (result.ok) {
      console.log(output);
    } else {
      console.error(output);
    }
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
