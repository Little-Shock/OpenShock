#!/usr/bin/env node

import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function cleanNextE2EArtifacts(projectRoot = path.resolve(__dirname, "..")) {
  const webRoot = path.join(projectRoot, "apps", "web");
  const tsconfigPath = path.join(webRoot, "tsconfig.json");

  const entries = await readdir(webRoot, { withFileTypes: true });
  const staleDirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(".next-e2e"))
    .map((entry) => path.join(webRoot, entry.name));

  await Promise.all(staleDirs.map((target) => rm(target, { recursive: true, force: true })));

  const tsconfig = JSON.parse(await readFile(tsconfigPath, "utf8"));
  const include = Array.isArray(tsconfig.include) ? tsconfig.include : [];
  const nextE2EWildcards = new Set([
    ".next-e2e-*/types/**/*.ts",
    ".next-e2e-*/dev/types/**/*.ts",
  ]);
  const normalizedInclude = include.filter((entry) => {
    if (typeof entry !== "string") {
      return true;
    }
    if (nextE2EWildcards.has(entry)) {
      return true;
    }
    return !/^\.next-e2e-[^*]/.test(entry);
  });

  const normalized = normalizedInclude.length !== include.length;
  if (normalized) {
    tsconfig.include = normalizedInclude;
    await writeFile(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`, "utf8");
  }

  return { cleanedDirs: staleDirs.length, normalizedTsconfig: normalized };
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedAsScript) {
  const result = await cleanNextE2EArtifacts();
  if (result.cleanedDirs > 0 || result.normalizedTsconfig) {
    const summary = [
      result.cleanedDirs > 0 ? `cleaned ${result.cleanedDirs} Next E2E dist dir(s)` : "",
      result.normalizedTsconfig ? "normalized apps/web/tsconfig.json" : "",
    ]
      .filter(Boolean)
      .join("; ");
    console.log(summary);
  }
}
