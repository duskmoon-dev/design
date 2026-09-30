import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync, mkdtempSync, cpSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parse as parseYAML } from 'yaml';
import references from './fixtures/sunshine-reference.json';
import { sunshineColors, sunshineMeta, sunshineShape } from '../generated/ts/sunshine.generated';
import {
  parseOklch, hexToOklch, oklchToLinearSrgb, oklchToRgb, isInSrgbGamut,
  srgbToLinear, relativeLuminance, contrastRatio,
} from './color';
import { sunshineContrastChecks, validateSunshineColors } from './palette';

const ROOT = join(import.meta.dir, '..');
const source = parseYAML(readFileSync(join(ROOT, 'tokens/sunshine.yaml'), 'utf8'));
const schema = parseYAML(readFileSync(join(ROOT, 'tokens/_schema.yaml'), 'utf8'));
const colors: Record<string, string> = source.colors;
const json = JSON.parse(readFileSync(join(ROOT, 'generated/sunshine.json'), 'utf8'));
const css = readFileSync(join(ROOT, 'generated/sunshine.css'), 'utf8');
const dart = readFileSync(join(ROOT, 'generated/dart/sunshine_tokens.g.dart'), 'utf8');
const metadata = { name: source.name, mode: source.mode, family: source.family, pair: source.pair, description: source.description };
const camelCase = (name: string) => name.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());

function files(directory: string, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(result, files(join(directory, entry.name), path));
    else result[path] = readFileSync(join(directory, entry.name), 'utf8');
  }
  return result;
}

describe('Sunshine approved palette and shipped targets', () => {
  it('keeps every schema/public key and the approved identity and shape', () => {
    const required = Object.values(schema.groups).flatMap((group: any) => group.tokens).sort();
    expect(Object.keys(colors).sort()).toEqual(required);
    expect(Object.keys(references).sort()).toEqual(required);
    expect(Object.keys(sunshineColors).sort()).toEqual(required);
    expect(Object.keys(json.colors).sort()).toEqual(required);
    expect(Object.keys(metadata).sort()).toEqual(['description', 'family', 'mode', 'name', 'pair']);
    expect(metadata).toMatchObject({ name: 'sunshine', mode: 'light', family: 'duskmoon', pair: 'moonlight' });
    expect(sunshineMeta).toEqual(metadata);
    expect(json.meta).toEqual(metadata);
    expect(source.shape).toEqual({
      'radius-selector': '0.25rem', 'radius-field': '0.625rem', 'radius-box': '2rem',
      'size-selector': '0.1875rem', 'size-field': '0.1875rem', border: '0.5px', depth: 1, noise: 1,
    });
    expect(Object.keys(source.shape).sort()).toEqual([...schema.shape.tokens].sort());
    expect(sunshineShape).toEqual(source.shape);
    expect(json.shape).toEqual(source.shape);
    for (const [key, value] of Object.entries(metadata)) {
      expect(css).toContain(`--theme-${key}: "${value}";`);
      expect(dart).toContain(`static const String ${key} = '${value}';`);
    }
    expect(css).toContain('[data-theme="sunshine"]');
    expect(dart).toContain('abstract final class DuskMoonSunshineTokens');
    expect(dart).toContain('static const double radiusField = 10;');
  });

  for (const [token, reference] of Object.entries(references)) {
    it(`${token} round-trips the approved reference in every target`, () => {
      const expected = [1, 3, 5].map(offset => parseInt(reference.slice(offset, offset + 2), 16));
      const rgb = oklchToRgb(colors[token]);
      const channels = [rgb.r, rgb.g, rgb.b];
      channels.forEach((channel, index) => expect(Math.abs(channel - expected[index])).toBeLessThanOrEqual(1));
      const parsed = parseOklch(colors[token]);
      expect(json.colors[token]).toMatchObject({ l: parsed.l, c: parsed.c, h: parsed.h });
      for (const offset of [1, 3, 5]) {
        expect(Math.abs(parseInt(json.colors[token].hex.slice(offset, offset + 2), 16) - parseInt(reference.slice(offset, offset + 2), 16))).toBeLessThanOrEqual(1);
      }
      expect(sunshineColors[token as keyof typeof sunshineColors]).toBe(colors[token]);
      const cssRaw = css.match(new RegExp(`--color-${token}: oklch\\(([^)]+)\\);`))?.[1];
      expect(cssRaw).toBe(colors[token]);
      const dartName = token === 'surface-variant' || token === 'surface-container-highest' ? 'surfaceContainerHighest' : camelCase(token);
      const dartHex = dart.match(new RegExp(`static const Color ${dartName} = Color\\(0x([A-F0-9]{8})\\);`))?.[1];
      expect(dartHex).toBeDefined();
      for (const [index, offset] of [2, 4, 6].entries()) {
        expect(Math.abs(parseInt(dartHex!.slice(offset, offset + 2), 16) - expected[index])).toBeLessThanOrEqual(1);
      }
      expect(dartHex!.slice(0, 2)).toBe(token === 'scrim' ? '80' : 'FF');
    });
  }

  it('preserves scrim alpha and warm-neutral correspondences', () => {
    expect(parseOklch(colors.scrim).alpha).toBe(0.5);
    expect(json.colors.scrim.alpha).toBe(0.5);
    expect(colors.surface).toBe(colors['base-100']);
    expect(colors['surface-container-low']).toBe(colors['base-200']);
    expect(colors['surface-container-high']).toBe(colors['base-300']);
  });

  it('locks lavender, not the rejected coral secondary', () => {
    expect(json.colors.secondary.hex).toBe('#B5A6D9');
    expect(json.colors['secondary-container'].hex).toBe('#F0EBF8');
    expect(colors.secondary).not.toBe('62% 0.19 20');
    expect(contrastRatio(colors['secondary-content'], colors.secondary)).toBeGreaterThanOrEqual(4.5);
  });

  it('builds deterministic gallery reports from shipped data for both rendering modes', () => {
    const build = () => {
      const result = Bun.spawnSync([process.execPath, join(ROOT, 'scripts/build-pages.ts')], { cwd: ROOT });
      expect(result.exitCode).toBe(0);
      return readFileSync(join(ROOT, '_site/index.html'), 'utf8');
    };
    const html = build();
    expect(build()).toBe(html);
    expect(html).not.toMatch(/__(THEME|SHARED|CONTRAST)_DATA__/);
    const embeddedThemes = JSON.parse(html.match(/<script id="theme-data" type="application\/json">([\s\S]*?)<\/script>/)![1]);
    expect(embeddedThemes.sunshine).toEqual(json);
    const reports = JSON.parse(html.match(/<script id="contrast-data" type="application\/json">([\s\S]*?)<\/script>/)![1]);
    const checks = sunshineContrastChecks(colors);
    expect(reports.sunshine.outOfGamut).toEqual([]);
    expect(reports.sunshine.checks.length).toBe(checks.length);
    reports.sunshine.checks.forEach((check: any, index: number) => {
      expect(check.ratio).toBeCloseTo(checks[index].ratio, 12);
      expect(check.ratio).toBeGreaterThanOrEqual(check.minimum);
      expect(check.srgbRatio).toBeGreaterThanOrEqual(check.minimum);
    });
    expect(Object.keys(reports).sort()).toEqual(Object.keys(embeddedThemes).sort());
  });

  it('runs all target commands deterministically without altering authored inputs', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sunshine-codegen-'));
    try {
      cpSync(join(ROOT, 'tokens'), join(directory, 'tokens'), { recursive: true });
      cpSync(join(ROOT, 'codegen.yaml'), join(directory, 'codegen.yaml'));
      const inputs = files(join(directory, 'tokens'));
      const run = (...args: string[]) => {
        const result = Bun.spawnSync([process.execPath, join(ROOT, 'scripts/codegen.ts'), ...args], { cwd: directory });
        expect(result.exitCode).toBe(0);
        return result;
      };
      run('generate', '--target', 'all');
      run('docs');
      const first = files(join(directory, 'generated'));
      expect(first).toEqual(files(join(ROOT, 'generated')));
      for (const target of ['typescript', 'dart', 'json', 'css', 'all']) run('generate', '--target', target);
      run('docs');
      expect(files(join(directory, 'generated'))).toEqual(first);
      expect(files(join(directory, 'tokens'))).toEqual(inputs);
      const broken = { ...source, colors: { ...colors, 'primary-content': colors.primary } };
      writeFileSync(join(directory, 'tokens/sunshine.yaml'), JSON.stringify(broken));
      for (const command of ['validate', 'generate']) {
        const result = Bun.spawnSync([process.execPath, join(ROOT, 'scripts/codegen.ts'), command], { cwd: directory });
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr.toString()).toContain('primary fill text');
      }
      broken.colors.primary = '60% 0.5 30';
      writeFileSync(join(directory, 'tokens/sunshine.yaml'), JSON.stringify(broken));
      const result = Bun.spawnSync([process.execPath, join(ROOT, 'scripts/codegen.ts'), 'validate'], { cwd: directory });
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toString()).toContain('outside sRGB gamut');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('Sunshine accessibility gates', () => {
  it('checks unbounded authored channels before clamping', () => {
    for (const value of Object.values(colors)) {
      const channels = oklchToLinearSrgb(value);
      expect(channels.every(Number.isFinite)).toBe(true);
      for (const channel of channels) {
        expect(channel).toBeGreaterThanOrEqual(-1e-6);
        expect(channel).toBeLessThanOrEqual(1 + 1e-6);
      }
      expect(isInSrgbGamut(value)).toBe(true);
    }
    expect(validateSunshineColors(colors)).toEqual([]);
  });

  for (const check of sunshineContrastChecks(colors)) {
    it(`${check.label}: ${check.foreground}/${check.background} >= ${check.minimum}`, () => {
      expect(check.ratio).toBeGreaterThanOrEqual(check.minimum);
    });
  }

  it('rejects unreadable text, insufficient boundaries and out-of-gamut fixtures', () => {
    expect(validateSunshineColors({ ...colors, 'primary-content': colors.primary }).some(error => error.includes('primary fill text'))).toBe(true);
    expect(validateSunshineColors({ ...colors, outline: colors.surface }).some(error => error.includes('control outline'))).toBe(true);
    expect(validateSunshineColors({ ...colors, 'on-primary-container': colors.primary }).some(error => error.includes('keyboard focus'))).toBe(true);
    expect(isInSrgbGamut('60% 0.5 30')).toBe(false);
    expect(oklchToLinearSrgb('60% 0.5 30').some(channel => channel < 0 || channel > 1)).toBe(true);
    expect(validateSunshineColors({ ...colors, accent: '60% 0.5 30' }).some(error => error.includes('outside sRGB gamut'))).toBe(true);
    expect(contrastRatio(colors['outline-variant'], colors.surface)).toBeLessThan(3);
    expect(contrastRatio(colors.primary, colors.surface)).toBeLessThan(3);
    expect(contrastRatio(colors['base-content'], colors['base-900'])).toBeLessThan(4.5);
  });

  it('rejects malformed and non-finite components without a universal chroma cap', () => {
    for (const value of ['', 'NaN% 0 0', '50% Infinity 0', '50% 0 NaN', '101% 0 0', '50% -0.1 30', '50% 0 361', '50% 0 30 / 101%', '50% 0 30 /', '50% 0 30 extra', '50% 0 30 / 50% / 50%', '9'.repeat(400) + '% 0 0']) {
      expect(() => parseOklch(value)).toThrow();
      expect(isInSrgbGamut(value)).toBe(false);
      expect(validateSunshineColors({ ...colors, primary: value }).length).toBeGreaterThan(0);
    }
    expect(parseOklch('50% 0.6 30').c).toBe(0.6);
    expect(() => hexToOklch('#oops')).toThrow();
  });
});

describe('Independent color-math references', () => {
  it('matches published OKLab sRGB-red and achromatic references', () => {
    const red = parseOklch(hexToOklch('#FF0000'));
    expect(red.l).toBeCloseTo(0.6279553606, 8);
    expect(red.c * Math.cos(red.h * Math.PI / 180)).toBeCloseTo(0.2248630611, 8);
    expect(red.c * Math.sin(red.h * Math.PI / 180)).toBeCloseTo(0.1258462985, 8);
    expect(oklchToRgb('62.79553606% 0.2576833077 29.23388519')).toEqual({ r: 255, g: 0, b: 0 });
    expect(oklchToLinearSrgb('50% 0 0')).toEqual([0.125, 0.125, 0.125]);
  });

  it('uses WCAG channel weights, gamma and unrounded ratios', () => {
    expect(srgbToLinear(0.04)).toBeCloseTo(0.00309597523, 10);
    expect(srgbToLinear(0.5)).toBeCloseTo(0.21404114048, 10);
    expect(relativeLuminance(hexToOklch('#FF0000'))).toBeCloseTo(0.2126, 6);
    expect(relativeLuminance(hexToOklch('#00FF00'))).toBeCloseTo(0.7152, 6);
    expect(relativeLuminance(hexToOklch('#0000FF'))).toBeCloseTo(0.0722, 6);
    expect(contrastRatio('0% 0 0', '100% 0 0')).toBeCloseTo(21, 8);
    expect(contrastRatio(hexToOklch('#777777'), '100% 0 0')).toBeCloseTo(4.478089454, 6);
    expect(contrastRatio(hexToOklch('#777777'), '100% 0 0')).toBeLessThan(4.5);
  });

  it('composites alpha in display sRGB over the actual background', () => {
    expect(contrastRatio('0% 0 0 / 50%', '100% 0 0')).toBeCloseTo(3.9766530249, 8);
    expect(contrastRatio('100% 0 0 / 50%', '0% 0 0')).toBeCloseTo(5.2808228096, 8);
    expect(contrastRatio('0% 0 0 / 0%', colors.surface)).toBeCloseTo(1, 8);
    expect(contrastRatio(colors.scrim, colors.surface)).not.toBe(contrastRatio(colors.scrim, colors['primary-container']));
    expect(() => contrastRatio(colors.primary, colors.scrim)).toThrow('opaque');
  });
});
