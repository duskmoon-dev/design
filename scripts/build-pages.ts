#!/usr/bin/env bun
/**
 * build-pages.ts — Embeds generated JSON into docs/index.html for GitHub Pages.
 *
 * Reads theme JSON files and tokens.json, injects them into the HTML template,
 * and writes the final output to _site/index.html (keeping the template intact).
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { hexToOklch, isInSrgbGamut, contrastRatio } from "./color";
import { sunshineContrastChecks } from "./palette";

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

const contrastData = Object.fromEntries(Object.entries(themeData).map(([name, theme]) => {
  const { colors } = theme as { colors: Record<string, { l: number; c: number; h: number; hex: string; alpha?: number }> };
  const raw = Object.fromEntries(Object.entries(colors).map(([token, color]) => [token,
    `${color.l * 100}% ${color.c} ${color.h}${color.alpha === undefined ? '' : ` / ${color.alpha * 100}%`}`,
  ]));
  const srgb = Object.fromEntries(Object.entries(colors).map(([token, color]) => [token,
    hexToOklch(color.hex) + (color.alpha === undefined ? '' : ` / ${color.alpha * 100}%`),
  ]));
  return [name, {
    checks: sunshineContrastChecks(raw).map(check => ({
      ...check, srgbRatio: contrastRatio(srgb[check.foreground], srgb[check.background]),
    })),
    outOfGamut: Object.keys(colors).filter(token => !isInSrgbGamut(raw[token])),
  }];
}));

// Read HTML template and replace placeholders
let html = readFileSync(TEMPLATE_PATH, "utf-8");
html = html.replace("__THEME_DATA__", JSON.stringify(themeData));
html = html.replace("__SHARED_DATA__", JSON.stringify(sharedData));
html = html.replace("__CONTRAST_DATA__", JSON.stringify(contrastData));

// Write to _site/
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "index.html"), html, "utf-8");

const themeCount = Object.keys(themeData).length;
console.log(
  `✓ Built _site/index.html with ${themeCount} themes: ${Object.keys(themeData).join(", ")}`,
);
