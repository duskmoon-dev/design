import { describe, expect, it } from 'bun:test';
import { readFileSync, mkdtempSync, cpSync, rmSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { parse } from 'yaml';
import references from './fixtures/sunshine-reference.json';
import { parseOklch, oklchToHex, oklchToLinearSrgb, hexToOklch, hexToRgb, contrast, luminance, composite, inSrgbGamut, tokenContrast } from './color';
import { assessPalette, SUNSHINE_CHECKS } from './palette';
import { sunshineColors, sunshineMeta, sunshineShape } from '../generated/ts/sunshine.generated';

const ROOT = resolve(import.meta.dir, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const source = parse(read('tokens/sunshine.yaml'));
const camel = (s: string) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

describe('Independent color math references', () => {
  it('matches standard sRGB primaries in OKLab/OKLCH', () => {
    // Ottosson OKLab reference sRGB red: L=.62795536 a=.22486306 b=.12584630.
    const red = parseOklch(hexToOklch('#FF0000'));
    expect(red.l).toBeCloseTo(0.62795536, 7);
    expect(red.c * Math.cos(red.h * Math.PI / 180)).toBeCloseTo(0.22486306, 7);
    expect(red.c * Math.sin(red.h * Math.PI / 180)).toBeCloseTo(0.12584630, 7);
    expect(oklchToHex('62.795536% 0.25768331 29.233885')).toBe('#FF0000');
    expect(oklchToHex('86.643961% 0.29482724 142.495339')).toBe('#00FF00');
    expect(oklchToHex('45.201372% 0.31321437 264.052021')).toBe('#0000FF');
  });
  it('uses WCAG luminance and unrounded ratios', () => {
    expect(luminance(hexToRgb('#FF0000'))).toBeCloseTo(0.2126, 10);
    expect(contrast(hexToRgb('#000000'), hexToRgb('#FFFFFF'))).toBe(21);
    expect(contrast(hexToRgb('#777777'), hexToRgb('#FFFFFF'))).toBeCloseTo(4.478089, 5);
    expect(contrast(hexToRgb('#777777'), hexToRgb('#FFFFFF'))).toBeLessThan(4.5);
  });
  it('composites alpha against the actual background before contrast', () => {
    expect(composite([0,0,0], 0.5, [1,1,1])).toEqual([0.5,0.5,0.5]);
    expect(tokenContrast('0% 0 0 / 50%', '100% 0 0')).toBeCloseTo(3.976653, 5);
    expect(tokenContrast('100% 0 0', '0% 0 0 / 50%', '100% 0 0')).toBeCloseTo(3.976653, 5);
    expect(() => tokenContrast('100% 0 0', '0% 0 0 / 50%')).toThrow();
  });
  it('rejects malformed, nonfinite and out-of-range components without a chroma cap', () => {
    for (const invalid of ['NaN% 0 0', '50% Infinity 20', '50% 0.1', '50% 0.1 20 junk', '50% 0.1 20 / 50% / 20%', '101% 0 0', '50% -0.1 20', '50% 0 0 / 101%', `${'9'.repeat(400)}% 0 0`]) {
      expect(() => parseOklch(invalid)).toThrow();
      expect(inSrgbGamut(invalid)).toBe(false);
    }
    expect(parseOklch('50% 0.6 42').c).toBe(0.6);
    expect(inSrgbGamut('50% 0.6 42')).toBe(false);
    expect(oklchToLinearSrgb('50% 0.6 42').some(v => v < 0 || v > 1)).toBe(true);
  });
});

describe('Approved Sunshine palette', () => {
  it('preserves the public key set, identity and shapes', () => {
    const schema = parse(read('tokens/_schema.yaml'));
    const keys = Object.values(schema.groups).flatMap((g: any) => g.tokens).sort();
    expect(Object.keys(source.colors).sort()).toEqual(keys);
    expect(Object.keys(references).sort()).toEqual(keys);
    expect({ ...source, colors: undefined, shape: undefined, description: undefined }).toEqual({ name: 'sunshine', mode: 'light', family: 'duskmoon', pair: 'moonlight', colors: undefined, shape: undefined, description: undefined });
    expect(source.shape).toEqual({ 'radius-selector': '0.25rem', 'radius-field': '0.625rem', 'radius-box': '2rem', 'size-selector': '0.1875rem', 'size-field': '0.1875rem', border: '0.5px', depth: 1, noise: 1 });
  });
  it('round trips every approved reference within one byte per channel', () => {
    for (const [key, hex] of Object.entries(references)) {
      const actual = hexToRgb(oklchToHex(source.colors[key]));
      const expected = hexToRgb(hex);
      for (let i=0; i<3; i++) expect(Math.abs(actual[i]-expected[i])*255, key).toBeLessThanOrEqual(1);
    }
  });
  it('keeps lavender (not coral), warm correspondences and scrim alpha', () => {
    expect(oklchToHex(source.colors.secondary)).toBe('#B5A6D9');
    for (const [a,b] of [['surface','base-100'], ['surface-container-low','base-200'], ['surface-container-high','base-300']]) expect(source.colors[a]).toBe(source.colors[b]);
    expect(parseOklch(source.colors.scrim).alpha).toBe(0.5);
  });
  it('passes all intended text, control, link, selection and focus contexts plus unclipped gamut', () => {
    const result = assessPalette(source.colors);
    expect(result.gamutFailures).toEqual([]);
    expect(result.contrasts.filter(c => !c.pass)).toEqual([]);
    expect(result.pass).toBe(true);
    const generated = JSON.parse(read('generated/sunshine.json')).colors;
    for (const check of SUNSHINE_CHECKS) {
      expect(contrast(hexToRgb(generated[check.foreground].hex), hexToRgb(generated[check.background].hex)), `${check.context}: generated sRGB`).toBeGreaterThanOrEqual(check.minimum);
    }
  });
  it('fails unreadable text, invisible control cues and clipped-color negative controls', () => {
    for (const patch of [
      { 'primary-content': source.colors.primary },
      { outline: source.colors.surface },
      { 'on-primary-container': source.colors.surface },
      { warning: '50% 0.6 42' },
    ]) expect(assessPalette({ ...source.colors, ...patch }).pass).toBe(false);
    // Bright gold is a fill, not small text or a sole focus cue on ivory.
    expect(tokenContrast(source.colors.primary, source.colors.surface)).toBeLessThan(3);
  });
  it('synchronizes meaning across JSON, TS, CSS and Dart (including the Flutter alias)', () => {
    const json = JSON.parse(read('generated/sunshine.json'));
    const css = read('generated/sunshine.css'), dart = read('generated/dart/sunshine_tokens.g.dart');
    expect(json.meta).toEqual(sunshineMeta);
    expect(json.meta).toEqual(Object.fromEntries(['name','mode','family','pair','description'].map(k => [k, source[k]])));
    expect(json.shape).toEqual(source.shape);
    expect(Object.keys(json.colors).sort()).toEqual(Object.keys(source.colors).sort());
    expect(Object.keys(sunshineColors).sort()).toEqual(Object.keys(source.colors).sort());
    for (const [key, value] of Object.entries(source.colors) as [string,string][]) {
      const parsed = parseOklch(value), hex = oklchToHex(value);
      expect(json.colors[key]).toEqual({ l: parsed.l, c: parsed.c, h: parsed.h, hex, ...(parsed.alpha === undefined ? {} : { alpha: parsed.alpha }) });
      expect(sunshineColors[key as keyof typeof sunshineColors]).toBe(value);
      expect(css).toContain(`--color-${key}: oklch(${value});`);
      if (key === 'surface-container-highest') continue;
      const dartKey = key === 'surface-variant' ? 'surfaceContainerHighest' : camel(key);
      const alpha = Math.round((parsed.alpha ?? 1)*255).toString(16).padStart(2,'0').toUpperCase();
      expect(dart).toContain(`static const Color ${dartKey} = Color(0x${alpha}${hex.slice(1)});`);
    }
    for (const [key,value] of Object.entries(source.shape)) expect(sunshineShape[key as keyof typeof sunshineShape]).toBe(value);
    expect(css).toContain('[data-theme="sunshine"]');
    expect(dart).not.toContain('static const Color surfaceVariant');
    for (const [key,value] of Object.entries(json.meta)) {
      expect(css).toContain(`--theme-${key}: "${value}";`);
      expect(dart).toContain(`static const String ${key} = '${value}';`);
    }
  });
  it('regenerates all targets deterministically in an isolated temporary directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'design-generation-'));
    const files = (base: string, prefix = ''): Record<string,string> => Object.fromEntries(readdirSync(join(base,prefix), { withFileTypes: true }).flatMap(e => {
      const p = join(prefix,e.name);
      return e.isDirectory() ? Object.entries(files(base,p)) : [[p,readFileSync(join(base,p),'utf8')]];
    }));
    try {
      cpSync(join(ROOT,'tokens'), join(dir,'tokens'), { recursive: true });
      cpSync(join(ROOT,'codegen.yaml'), join(dir,'codegen.yaml'));
      const run = async (command: string) => {
        const p = Bun.spawn(['bun',join(ROOT,'scripts/codegen.ts'),command], { cwd: dir, stdout: 'pipe', stderr: 'pipe' });
        const [out,err,code] = await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);
        expect(code, out+err).toBe(0);
      };
      await run('generate'); await run('docs');
      const first = files(join(dir,'generated'));
      expect(first).toEqual(files(join(ROOT,'generated')));
      await run('generate'); await run('docs');
      expect(files(join(dir,'generated'))).toEqual(first);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
