import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const globalsPath = resolve(__dirname, "../app/globals.css");

function themeColor(name: string) {
  const source = readFileSync(globalsPath, "utf8");
  const match = source.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6});`));
  assert.ok(match, `${name} should be declared as a hex color`);
  return match[1];
}

function channelToLinear(value: number) {
  const normalized = value / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

function contrastRatio(left: string, right: string) {
  const leftLum = luminance(left);
  const rightLum = luminance(right);
  const lighter = Math.max(leftLum, rightLum);
  const darker = Math.min(leftLum, rightLum);
  return (lighter + 0.05) / (darker + 0.05);
}

test("红色警示背景与白字满足可读对比", () => {
  const ratio = contrastRatio(themeColor("--shock-pink"), "#ffffff");
  assert.ok(ratio >= 4.5, `shock-pink on white contrast = ${ratio.toFixed(2)}, want >= 4.5`);
});
