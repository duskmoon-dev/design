import { describe, expect, it } from 'bun:test';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { contrast, hexToRgb, inSrgbGamut, tokenContrast } from './color';

const ROOT = join(import.meta.dir, '..');
const THEMES = ['sunshine', 'moonlight', 'forest', 'ocean'];
const ROLES = ['primary', 'secondary', 'tertiary', 'accent', 'info', 'success', 'warning', 'error'];

describe('Filled brand and semantic labels (design#3)', () => {
  for (const name of THEMES) {
    const { colors } = parse(readFileSync(join(ROOT, `tokens/${name}.yaml`), 'utf8'));
    const generated = JSON.parse(readFileSync(join(ROOT, `generated/${name}.json`), 'utf8')).colors;
    for (const role of ROLES) {
      it(`${name}: ${role}-content on ${role} meets AA in native and generated sRGB`, () => {
        expect(tokenContrast(colors[`${role}-content`], colors[role])).toBeGreaterThanOrEqual(4.5);
        expect(contrast(hexToRgb(generated[`${role}-content`].hex), hexToRgb(generated[role].hex))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('keeps the three corrected tokens inside sRGB gamut', () => {
    for (const [name, role] of [['moonlight', 'error-content'], ['forest', 'tertiary'], ['forest', 'success']]) {
      const { colors } = parse(readFileSync(join(ROOT, `tokens/${name}.yaml`), 'utf8'));
      expect(inSrgbGamut(colors[role]), `${name}.${role}`).toBe(true);
    }
  });

  for (const name of THEMES) {
    it(`${name}: validation and generation reject unreadable filled labels`, () => {
      const dir = mkdtempSync(join(tmpdir(), 'design-filled-contrast-'));
      try {
        cpSync(join(ROOT, 'tokens'), join(dir, 'tokens'), { recursive: true });
        cpSync(join(ROOT, 'codegen.yaml'), join(dir, 'codegen.yaml'));
        const path = join(dir, `tokens/${name}.yaml`);
        const theme = parse(readFileSync(path, 'utf8'));
        theme.colors['error-content'] = theme.colors.error;
        writeFileSync(path, stringify(theme));
        for (const command of ['validate', 'generate']) {
          const result = Bun.spawnSync([process.execPath, join(ROOT, 'scripts/codegen.ts'), command], { cwd: dir });
          expect(result.exitCode).not.toBe(0);
          expect(result.stdout.toString() + result.stderr.toString()).toContain('error-content/error');
          expect(existsSync(join(dir, 'generated'))).toBe(false);
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
});
