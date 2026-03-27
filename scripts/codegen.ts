#!/usr/bin/env bun
/**
 * duskmoon-codegen — Design token code generator
 * Reads YAML token files and emits TS, Dart, JSON, CSS
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { parse as parseYAML } from 'yaml';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Schema {
  version: string;
  color_format: string;
  groups: Record<string, { tokens: string[]; description?: string }>;
}

interface ThemeFile {
  name: string;
  mode: 'light' | 'dark';
  colors: Record<string, string>;
}

interface TypeScaleEntry {
  size: number;
  weight: number;
  line_height: number;
  letter_spacing: number;
}

interface TypographyFile {
  type_scale: Record<string, TypeScaleEntry>;
}

interface SpacingFile {
  spacing: Record<string, number>;
  radius: Record<string, number>;
  elevation: Record<string, number>;
}

interface Config {
  input: string;
  output: string;
  targets: {
    typescript?: {
      output_dir: string;
      file_pattern: string;
      export_style: string;
    };
    dart?: {
      output_dir: string;
      file_pattern: string;
      class_prefix: string;
      color_type: string;
    };
    json?: {
      output_dir: string;
      file_pattern: string;
    };
    css?: {
      output_dir: string;
      file_pattern: string;
      selector_pattern: string;
      variable_prefix: string;
    };
  };
}

type Target = 'typescript' | 'dart' | 'json' | 'css' | 'all';

// ─── Color conversion ────────────────────────────────────────────────────────

function parseHSL(value: string): { h: number; s: number; l: number } {
  const parts = value.trim().split(/\s+/);
  return {
    h: parseFloat(parts[0]),
    s: parseFloat(parts[1].replace('%', '')),
    l: parseFloat(parts[2].replace('%', '')),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function hslToArgbHex(hslStr: string): string {
  const { h, s, l } = parseHSL(hslStr);
  const { r, g, b } = hslToRgb(h, s, l);
  return '0xFF' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function hslToHex(hslStr: string): string {
  const { h, s, l } = parseHSL(hslStr);
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// ─── File loaders ────────────────────────────────────────────────────────────

function loadConfig(configPath: string): Config {
  const raw = readFileSync(configPath, 'utf-8');
  return parseYAML(raw) as Config;
}

function loadSchema(tokenDir: string): Schema {
  const raw = readFileSync(join(tokenDir, '_schema.yaml'), 'utf-8');
  return parseYAML(raw) as Schema;
}

function loadThemes(tokenDir: string): ThemeFile[] {
  const files = readdirSync(tokenDir).filter(
    f => f.endsWith('.yaml') && !f.startsWith('_')
  );
  return files.map(f => {
    const raw = readFileSync(join(tokenDir, f), 'utf-8');
    return parseYAML(raw) as ThemeFile;
  });
}

function loadTypography(tokenDir: string): TypographyFile | null {
  const path = join(tokenDir, '_typography.yaml');
  if (!existsSync(path)) return null;
  return parseYAML(readFileSync(path, 'utf-8')) as TypographyFile;
}

function loadSpacing(tokenDir: string): SpacingFile | null {
  const path = join(tokenDir, '_spacing.yaml');
  if (!existsSync(path)) return null;
  return parseYAML(readFileSync(path, 'utf-8')) as SpacingFile;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(schema: Schema, themes: ThemeFile[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allTokens = Object.values(schema.groups).flatMap(g => g.tokens);

  for (const theme of themes) {
    // Check all schema tokens exist in theme
    for (const token of allTokens) {
      if (!(token in theme.colors)) {
        errors.push(`${theme.name}: missing token "${token}"`);
      }
    }
    // Check all theme tokens are in schema
    for (const token of Object.keys(theme.colors)) {
      if (!allTokens.includes(token)) {
        errors.push(`${theme.name}: unknown token "${token}" (not in schema)`);
      }
    }
    // Validate HSL format
    for (const [token, value] of Object.entries(theme.colors)) {
      if (!/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(value)) {
        errors.push(`${theme.name}.${token}: invalid HSL format "${value}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Emitters ────────────────────────────────────────────────────────────────

function emitTypeScript(theme: ThemeFile): string {
  const lines: string[] = [
    '// GENERATED — DO NOT EDIT',
    `// Source: tokens/${theme.name}.yaml`,
    '// Generator: duskmoon-codegen v1.0.0',
    '',
    "import type { ThemeColors } from '../types';",
    '',
    `export const ${theme.name}: ThemeColors = {`,
  ];

  const entries = Object.entries(theme.colors);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const needsQuotes = key.includes('-');
    const keyStr = needsQuotes ? `'${key}'` : key;
    const comma = i < entries.length - 1 ? ',' : ',';
    lines.push(`  ${keyStr}: '${value}'${comma}`);
  }

  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

function emitDart(theme: ThemeFile, classPrefix: string): string {
  const className = classPrefix + theme.name.charAt(0).toUpperCase() + theme.name.slice(1) + 'Tokens';
  const lines: string[] = [
    '// GENERATED — DO NOT EDIT',
    `// Source: tokens/${theme.name}.yaml`,
    '// Generator: duskmoon-codegen v1.0.0',
    '',
    "import 'dart:ui' show Color;",
    '',
    `abstract final class ${className} {`,
  ];

  for (const [key, value] of Object.entries(theme.colors)) {
    const dartName = key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    const argbHex = hslToArgbHex(value);
    lines.push(`  static const Color ${dartName} = Color(${argbHex});`);
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function emitJSON(theme: ThemeFile): string {
  const result: Record<string, { h: number; s: number; l: number; hex: string }> = {};
  for (const [key, value] of Object.entries(theme.colors)) {
    const { h, s, l } = parseHSL(value);
    result[key] = { h, s, l, hex: hslToHex(value) };
  }
  return JSON.stringify(result, null, 2) + '\n';
}

function emitCSS(theme: ThemeFile, selectorPattern: string, variablePrefix: string): string {
  const selector = selectorPattern.replace('{theme}', theme.name);
  const lines: string[] = [
    '/* GENERATED — DO NOT EDIT */',
    `/* Source: tokens/${theme.name}.yaml */`,
    '/* Generator: duskmoon-codegen v1.0.0 */',
    '',
    `${selector} {`,
  ];

  for (const [key, value] of Object.entries(theme.colors)) {
    lines.push(`  ${variablePrefix}${key}: hsl(${value});`);
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

// ─── Typography & Spacing Emitters ──────────────────────────────────────────

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function emitDartTypography(typography: TypographyFile): string {
  const lines: string[] = [
    '// GENERATED — DO NOT EDIT',
    '// Source: tokens/_typography.yaml',
    '// Generator: duskmoon-codegen v1.0.0',
    '',
    "import 'package:flutter/painting.dart' show TextStyle, FontWeight;",
    '',
    'abstract final class DmTypeScale {',
  ];

  for (const [name, entry] of Object.entries(typography.type_scale)) {
    const dartName = kebabToCamel(name);
    const height = (entry.line_height / entry.size).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    const w = entry.weight;
    const weightStr = `FontWeight.w${w}`;
    lines.push(`  static const TextStyle ${dartName} = TextStyle(`);
    lines.push(`    fontSize: ${entry.size},`);
    lines.push(`    fontWeight: ${weightStr},`);
    lines.push(`    height: ${height},`);
    lines.push(`    letterSpacing: ${entry.letter_spacing},`);
    lines.push('  );');
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function emitDartSpacing(spacing: SpacingFile): string {
  const lines: string[] = [
    '// GENERATED — DO NOT EDIT',
    '// Source: tokens/_spacing.yaml',
    '// Generator: duskmoon-codegen v1.0.0',
    '',
  ];

  // Spacing
  lines.push('abstract final class DmSpacing {');
  for (const [key, value] of Object.entries(spacing.spacing)) {
    lines.push(`  static const double s${key} = ${value};`);
  }
  lines.push('}');
  lines.push('');

  // Radius
  lines.push('abstract final class DmRadius {');
  for (const [key, value] of Object.entries(spacing.radius)) {
    // Dart identifiers can't start with a digit — prefix with 'r'
    const dartKey = /^\d/.test(key) ? `r${key}` : key;
    lines.push(`  static const double ${dartKey} = ${value};`);
  }
  lines.push('}');
  lines.push('');

  // Elevation
  lines.push('abstract final class DmElevation {');
  for (const [key, value] of Object.entries(spacing.elevation)) {
    lines.push(`  static const double ${key} = ${value};`);
  }
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function emitCSSSpacing(spacing: SpacingFile): string {
  const lines: string[] = [
    '/* GENERATED — DO NOT EDIT */',
    '/* Source: tokens/_spacing.yaml */',
    '/* Generator: duskmoon-codegen v1.0.0 */',
    '',
    ':root {',
  ];

  for (const [key, value] of Object.entries(spacing.spacing)) {
    lines.push(`  --spacing-${key}: ${value}px;`);
  }
  lines.push('');
  for (const [key, value] of Object.entries(spacing.radius)) {
    lines.push(`  --radius-${key}: ${value}px;`);
  }
  lines.push('');
  for (const [key, value] of Object.entries(spacing.elevation)) {
    lines.push(`  --elevation-${key}: ${value}px;`);
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function emitTSSpacing(spacing: SpacingFile): string {
  const lines: string[] = [
    '// GENERATED — DO NOT EDIT',
    '// Source: tokens/_spacing.yaml',
    '// Generator: duskmoon-codegen v1.0.0',
    '',
    'export const spacing = {',
  ];

  for (const [key, value] of Object.entries(spacing.spacing)) {
    lines.push(`  ${key}: ${value},`);
  }
  lines.push('} as const;');
  lines.push('');

  lines.push('export const radius = {');
  for (const [key, value] of Object.entries(spacing.radius)) {
    const keyStr = key.includes('x') || key === 'full' || key === 'none' ? key : key;
    lines.push(`  '${keyStr}': ${value},`);
  }
  lines.push('} as const;');
  lines.push('');

  lines.push('export const elevation = {');
  for (const [key, value] of Object.entries(spacing.elevation)) {
    lines.push(`  ${key}: ${value},`);
  }
  lines.push('} as const;');
  lines.push('');

  return lines.join('\n');
}

function emitTSTypography(typography: TypographyFile): string {
  const lines: string[] = [
    '// GENERATED — DO NOT EDIT',
    '// Source: tokens/_typography.yaml',
    '// Generator: duskmoon-codegen v1.0.0',
    '',
    'export interface TypeScaleEntry {',
    '  size: number;',
    '  weight: number;',
    '  lineHeight: number;',
    '  letterSpacing: number;',
    '}',
    '',
    'export const typeScale: Record<string, TypeScaleEntry> = {',
  ];

  for (const [name, entry] of Object.entries(typography.type_scale)) {
    const tsName = `'${name}'`;
    lines.push(`  ${tsName}: { size: ${entry.size}, weight: ${entry.weight}, lineHeight: ${entry.line_height}, letterSpacing: ${entry.letter_spacing} },`);
  }

  lines.push('} as const;');
  lines.push('');
  return lines.join('\n');
}

function emitJSONTypographySpacing(typography: TypographyFile | null, spacing: SpacingFile | null): string {
  const result: Record<string, unknown> = {};
  if (typography) {
    result.typeScale = {};
    for (const [name, entry] of Object.entries(typography.type_scale)) {
      (result.typeScale as Record<string, unknown>)[name] = {
        size: entry.size,
        weight: entry.weight,
        lineHeight: entry.line_height,
        letterSpacing: entry.letter_spacing,
      };
    }
  }
  if (spacing) {
    result.spacing = spacing.spacing;
    result.radius = spacing.radius;
    result.elevation = spacing.elevation;
  }
  return JSON.stringify(result, null, 2) + '\n';
}

// ─── Write helpers ───────────────────────────────────────────────────────────

function writeOutput(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
  console.log(`  wrote: ${filePath}`);
}

// ─── Commands ────────────────────────────────────────────────────────────────

function resolveDir(base: string, dir: string): string {
  return resolve(base, dir);
}

function cmdGenerate(configDir: string, config: Config, targets: Target[]): void {
  const tokenDir = resolveDir(configDir, config.input);
  const schema = loadSchema(tokenDir);
  const themes = loadThemes(tokenDir);
  const typography = loadTypography(tokenDir);
  const spacing = loadSpacing(tokenDir);

  // Validate first
  const result = validate(schema, themes);
  if (!result.valid) {
    console.error('Validation failed:');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const shouldGenerate = (t: Target) => targets.includes('all') || targets.includes(t);

  for (const theme of themes) {
    if (shouldGenerate('typescript') && config.targets.typescript) {
      const tc = config.targets.typescript;
      const outDir = resolveDir(configDir, tc.output_dir);
      const fileName = tc.file_pattern.replace('{theme}', theme.name);
      writeOutput(join(outDir, fileName), emitTypeScript(theme));
    }

    if (shouldGenerate('dart') && config.targets.dart) {
      const dc = config.targets.dart;
      const outDir = resolveDir(configDir, dc.output_dir);
      const fileName = dc.file_pattern.replace('{theme}', theme.name);
      writeOutput(join(outDir, fileName), emitDart(theme, dc.class_prefix));
    }

    if (shouldGenerate('json') && config.targets.json) {
      const jc = config.targets.json;
      const outDir = resolveDir(configDir, jc.output_dir);
      const fileName = jc.file_pattern.replace('{theme}', theme.name);
      writeOutput(join(outDir, fileName), emitJSON(theme));
    }

    if (shouldGenerate('css') && config.targets.css) {
      const cc = config.targets.css;
      const outDir = resolveDir(configDir, cc.output_dir);
      const fileName = cc.file_pattern.replace('{theme}', theme.name);
      writeOutput(join(outDir, fileName), emitCSS(theme, cc.selector_pattern, cc.variable_prefix));
    }
  }

  // Shared token files (typography + spacing) — emitted once, not per-theme
  if (shouldGenerate('dart') && config.targets.dart) {
    const dc = config.targets.dart;
    const outDir = resolveDir(configDir, dc.output_dir);
    if (typography) writeOutput(join(outDir, 'dm_type_scale.g.dart'), emitDartTypography(typography));
    if (spacing) writeOutput(join(outDir, 'dm_spacing.g.dart'), emitDartSpacing(spacing));
  }

  if (shouldGenerate('css') && config.targets.css) {
    const outDir = resolveDir(configDir, config.output);
    if (spacing) writeOutput(join(outDir, 'spacing.css'), emitCSSSpacing(spacing));
  }

  if (shouldGenerate('typescript') && config.targets.typescript) {
    const tc = config.targets.typescript;
    const outDir = resolveDir(configDir, tc.output_dir);
    if (typography) writeOutput(join(outDir, 'typography.generated.ts'), emitTSTypography(typography));
    if (spacing) writeOutput(join(outDir, 'spacing.generated.ts'), emitTSSpacing(spacing));
  }

  if (shouldGenerate('json') && config.targets.json) {
    const outDir = resolveDir(configDir, config.output);
    if (typography || spacing) writeOutput(join(outDir, 'tokens.json'), emitJSONTypographySpacing(typography, spacing));
  }

  console.log('Generation complete.');
}

function cmdValidate(configDir: string, config: Config): void {
  const tokenDir = resolveDir(configDir, config.input);
  const schema = loadSchema(tokenDir);
  const themes = loadThemes(tokenDir);
  const result = validate(schema, themes);

  if (result.valid) {
    console.log(`Validated ${themes.length} theme(s) against schema — all OK.`);
  } else {
    console.error('Validation failed:');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}

function cmdDiff(configDir: string, config: Config): void {
  const tokenDir = resolveDir(configDir, config.input);
  const themes = loadThemes(tokenDir);

  if (themes.length < 2) {
    console.error('Need at least 2 themes for diff');
    process.exit(1);
  }

  const [a, b] = themes;
  console.log(`Diff: ${a.name} vs ${b.name}\n`);

  const allKeys = new Set([...Object.keys(a.colors), ...Object.keys(b.colors)]);
  for (const key of allKeys) {
    const va = a.colors[key];
    const vb = b.colors[key];
    if (!va) {
      console.log(`  + ${key}: ${vb} (only in ${b.name})`);
    } else if (!vb) {
      console.log(`  - ${key}: ${va} (only in ${a.name})`);
    } else if (va !== vb) {
      console.log(`  ~ ${key}: ${va} → ${vb}`);
    }
  }
}

function cmdDocs(configDir: string, config: Config): void {
  const tokenDir = resolveDir(configDir, config.input);
  const schema = loadSchema(tokenDir);
  const themes = loadThemes(tokenDir);
  const typography = loadTypography(tokenDir);
  const spacing = loadSpacing(tokenDir);
  const lines: string[] = [
    '# DuskMoonUI Design Tokens Reference',
    '',
    `> Generated by duskmoon-codegen v1.0.0`,
    `> ${themes.length} theme(s): ${themes.map(t => t.name).join(', ')}`,
    '',
  ];

  for (const [groupName, group] of Object.entries(schema.groups)) {
    const g = group as { tokens: string[]; description?: string };
    lines.push(`## ${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`);
    if (g.description) lines.push(`> ${g.description}`);
    lines.push('');
    lines.push('| Token | ' + themes.map(t => t.name).join(' | ') + ' |');
    lines.push('|-------|' + themes.map(() => '-------').join('|') + '|');
    for (const token of g.tokens) {
      const values = themes.map(t => `\`${t.colors[token] ?? '—'}\``);
      lines.push(`| \`${token}\` | ${values.join(' | ')} |`);
    }
    lines.push('');
  }

  if (typography) {
    lines.push('## Typography');
    lines.push('');
    lines.push('| Style | Size | Weight | Line Height | Letter Spacing |');
    lines.push('|-------|------|--------|-------------|----------------|');
    for (const [name, entry] of Object.entries(typography.type_scale)) {
      lines.push(`| \`${name}\` | ${entry.size} | ${entry.weight} | ${entry.line_height} | ${entry.letter_spacing} |`);
    }
    lines.push('');
  }

  if (spacing) {
    lines.push('## Spacing');
    lines.push('');
    lines.push('| Key | Value (px) |');
    lines.push('|-----|------------|');
    for (const [key, value] of Object.entries(spacing.spacing)) {
      lines.push(`| \`${key}\` | ${value} |`);
    }
    lines.push('');

    lines.push('## Radius');
    lines.push('');
    lines.push('| Key | Value (px) |');
    lines.push('|-----|------------|');
    for (const [key, value] of Object.entries(spacing.radius)) {
      lines.push(`| \`${key}\` | ${value} |`);
    }
    lines.push('');

    lines.push('## Elevation');
    lines.push('');
    lines.push('| Level | Value (dp) |');
    lines.push('|-------|------------|');
    for (const [key, value] of Object.entries(spacing.elevation)) {
      lines.push(`| \`${key}\` | ${value} |`);
    }
    lines.push('');
  }

  const output = lines.join('\n');
  const outPath = join(resolveDir(configDir, config.output), 'TOKENS.md');
  writeOutput(outPath, output);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  const configPath = resolve(process.cwd(), 'codegen.yaml');
  if (!existsSync(configPath)) {
    console.error('codegen.yaml not found in current directory');
    process.exit(1);
  }

  const configDir = dirname(configPath);
  const config = loadConfig(configPath);

  switch (command) {
    case 'generate': {
      const targetIdx = args.indexOf('--target');
      const targets: Target[] =
        targetIdx >= 0 ? (args[targetIdx + 1].split(',') as Target[]) : ['all'];
      cmdGenerate(configDir, config, targets);
      break;
    }
    case 'validate':
      cmdValidate(configDir, config);
      break;
    case 'diff':
      cmdDiff(configDir, config);
      break;
    case 'docs':
      cmdDocs(configDir, config);
      break;
    default:
      console.log('Usage: duskmoon-codegen <command>');
      console.log('Commands: generate, validate, diff, docs');
      console.log('Options:');
      console.log('  generate --target <typescript|dart|json|css|all>');
      process.exit(1);
  }
}

main();
