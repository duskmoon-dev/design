#!/usr/bin/env bun
/**
 * build-pages.ts — Embeds generated JSON into docs/index.html for GitHub Pages.
 *
 * Reads theme JSON files and tokens.json, injects them into the HTML template,
 * and writes the final output to _site/index.html (keeping the template intact).
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { contrast, hexToRgb, tokenContrast } from "./color";
import { FILLS, CONTAINERS } from "./palette";

const ROOT = join(import.meta.dir, "..");
const GENERATED = join(ROOT, "generated");
const TEMPLATE_PATH = join(ROOT, "docs", "index.html");
const OUT_DIR = join(ROOT, "_site");

// Collect theme JSONs: { sunshine: {...}, moonlight: {...}, ... }
const themeData: Record<string, unknown> = {};
for (const file of readdirSync(GENERATED).sort()) {
  if (file.endsWith(".json") && file !== "tokens.json") {
    const name = file.replace(".json", "");
    themeData[name] = JSON.parse(readFileSync(join(GENERATED, file), "utf-8"));
  }
}

// Shared tokens (typography, spacing, radius, elevation)
const sharedData = JSON.parse(
  readFileSync(join(GENERATED, "tokens.json"), "utf-8"),
);

// Pair reports come from generated values, never the design-reference fixture.
const pairData = Object.fromEntries(Object.entries(themeData).map(([name, data]) => {
  const colors = (data as { colors: Record<string, { l: number; c: number; h: number; hex: string }> }).colors;
  const pairs = [...FILLS.map(role => [role, `${role}-content`]),
    ...CONTAINERS.map(role => [`${role}-container`, `on-${role}-container`])];
  const raw = (key: string) => `${colors[key].l*100}% ${colors[key].c} ${colors[key].h}`;
  return [name, pairs.map(([background, foreground]) => ({ background, foreground,
    srgb: contrast(hexToRgb(colors[foreground].hex), hexToRgb(colors[background].hex)),
    native: tokenContrast(raw(foreground), raw(background)),
  }))];
}));

// Read HTML template and replace placeholders
let html = readFileSync(TEMPLATE_PATH, "utf-8");
html = html.replace("__THEME_DATA__", JSON.stringify(themeData));
html = html.replace("__SHARED_DATA__", JSON.stringify(sharedData));
html = html.replace("__PAIR_DATA__", JSON.stringify(pairData));

// Write to _site/
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "index.html"), html, "utf-8");

const themeCount = Object.keys(themeData).length;
console.log(
  `✓ Built _site/index.html with ${themeCount} themes: ${Object.keys(themeData).join(", ")}`,
);
