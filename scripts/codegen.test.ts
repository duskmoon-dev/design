import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYAML } from 'yaml';

const ROOT = resolve(import.meta.dir, '..');

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (h < 60)       { r = c; g = x; b = 0; }
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

// ─── Schema tests ────────────────────────────────────────────────────────────

describe('Schema', () => {
  const schema = parseYAML(readFileSync(resolve(ROOT, 'tokens/_schema.yaml'), 'utf-8'));

  it('has version 1.0', () => {
    expect(schema.version).toBe('1.0');
  });

  it('uses hsl color format', () => {
    expect(schema.color_format).toBe('hsl');
  });

  it('defines all expected groups', () => {
    const groups = Object.keys(schema.groups);
    expect(groups).toContain('primary');
    expect(groups).toContain('secondary');
    expect(groups).toContain('tertiary');
    expect(groups).toContain('accent');
    expect(groups).toContain('neutral');
    expect(groups).toContain('surface');
    expect(groups).toContain('base');
    expect(groups).toContain('outline');
    expect(groups).toContain('inverse');
    expect(groups).toContain('shadow');
    expect(groups).toContain('semantic');
  });

  it('has at least 50 total tokens', () => {
    const allTokens = Object.values(schema.groups).flatMap((g: any) => g.tokens);
    expect(allTokens.length).toBeGreaterThanOrEqual(50);
  });
});

// ─── Theme file tests ────────────────────────────────────────────────────────

for (const themeName of ['sunshine', 'moonlight']) {
  describe(`Theme: ${themeName}`, () => {
    const theme = parseYAML(readFileSync(resolve(ROOT, `tokens/${themeName}.yaml`), 'utf-8'));
    const schema = parseYAML(readFileSync(resolve(ROOT, 'tokens/_schema.yaml'), 'utf-8'));
    const allTokens = Object.values(schema.groups).flatMap((g: any) => g.tokens);

    it('has correct name', () => {
      expect(theme.name).toBe(themeName);
    });

    it('has valid mode', () => {
      expect(['light', 'dark']).toContain(theme.mode);
    });

    it('contains all schema tokens', () => {
      for (const token of allTokens) {
        expect(theme.colors).toHaveProperty(token);
      }
    });

    it('has no extra tokens beyond schema', () => {
      for (const token of Object.keys(theme.colors)) {
        expect(allTokens).toContain(token);
      }
    });

    it('all values are valid HSL format', () => {
      for (const [key, value] of Object.entries(theme.colors)) {
        expect(value).toMatch(/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/);
      }
    });
  });
}

// ─── Color conversion tests ─────────────────────────────────────────────────

describe('HSL → RGB conversion', () => {
  it('converts pure red', () => {
    const { r, g, b } = hslToRgb(0, 100, 50);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('converts pure green', () => {
    const { r, g, b } = hslToRgb(120, 100, 50);
    expect(r).toBe(0);
    expect(g).toBe(255);
    expect(b).toBe(0);
  });

  it('converts pure blue', () => {
    const { r, g, b } = hslToRgb(240, 100, 50);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(255);
  });

  it('converts white', () => {
    const { r, g, b } = hslToRgb(0, 0, 100);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('converts black', () => {
    const { r, g, b } = hslToRgb(0, 0, 0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('converts amber (primary sunshine)', () => {
    const { r, g, b } = hslToRgb(38, 92, 50);
    // Expected: approximately #F59E0B
    expect(r).toBeGreaterThan(240);
    expect(g).toBeGreaterThan(150);
    expect(b).toBeLessThan(20);
  });
});

// ─── Generated output tests ─────────────────────────────────────────────────

describe('Generated TypeScript', () => {
  for (const themeName of ['sunshine', 'moonlight']) {
    const genPath = resolve(ROOT, `../duskmoonui/packages/core/src/themes/generated/${themeName}.generated.ts`);

    describe(themeName, () => {
      let content: string;
      try {
        content = readFileSync(genPath, 'utf-8');
      } catch {
        content = '';
      }

      it('exists', () => {
        expect(content.length).toBeGreaterThan(0);
      });

      it('has GENERATED header', () => {
        expect(content).toContain('GENERATED — DO NOT EDIT');
      });

      it('imports ThemeColors type', () => {
        expect(content).toContain("import type { ThemeColors } from '../types'");
      });

      it('exports named constant', () => {
        expect(content).toContain(`export const ${themeName}: ThemeColors`);
      });
    });
  }
});

describe('Generated JSON', () => {
  for (const themeName of ['sunshine', 'moonlight']) {
    it(`${themeName}.json is valid JSON with hex values`, () => {
      const content = readFileSync(resolve(ROOT, `generated/${themeName}.json`), 'utf-8');
      const data = JSON.parse(content);
      expect(data.primary).toBeDefined();
      expect(data.primary.hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(data.primary.h).toBeGreaterThanOrEqual(0);
      expect(data.primary.s).toBeGreaterThanOrEqual(0);
      expect(data.primary.l).toBeGreaterThanOrEqual(0);
    });
  }
});

describe('Generated CSS', () => {
  for (const themeName of ['sunshine', 'moonlight']) {
    it(`${themeName}.css has correct selector and variables`, () => {
      const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
      expect(content).toContain(`[data-theme="${themeName}"]`);
      expect(content).toContain('--color-primary: hsl(');
      expect(content).toContain('GENERATED — DO NOT EDIT');
    });
  }
});

describe('Generated Dart', () => {
  for (const themeName of ['sunshine', 'moonlight']) {
    it(`${themeName}_tokens.g.dart has correct class`, () => {
      const content = readFileSync(resolve(ROOT, `generated/dart/${themeName}_tokens.g.dart`), 'utf-8');
      const className = 'DuskMoon' + themeName.charAt(0).toUpperCase() + themeName.slice(1) + 'Tokens';
      expect(content).toContain(`abstract final class ${className}`);
      expect(content).toContain("import 'dart:ui' show Color");
      expect(content).toContain('static const Color primary = Color(0xFF');
    });
  }
});

// ─── Typography token tests ─────────────────────────────────────────────────

describe('Typography tokens', () => {
  const typography = parseYAML(readFileSync(resolve(ROOT, 'tokens/_typography.yaml'), 'utf-8'));

  it('has type_scale key', () => {
    expect(typography.type_scale).toBeDefined();
  });

  it('contains all MD3 styles', () => {
    const styles = Object.keys(typography.type_scale);
    for (const prefix of ['display', 'headline', 'title', 'body', 'label']) {
      for (const size of ['large', 'medium', 'small']) {
        expect(styles).toContain(`${prefix}-${size}`);
      }
    }
  });

  it('all entries have required fields', () => {
    for (const [name, entry] of Object.entries(typography.type_scale) as [string, any][]) {
      expect(entry.size).toBeGreaterThan(0);
      expect(entry.weight).toBeGreaterThanOrEqual(100);
      expect(entry.line_height).toBeGreaterThan(0);
      expect(typeof entry.letter_spacing).toBe('number');
    }
  });
});

// ─── Spacing token tests ────────────────────────────────────────────────────

describe('Spacing tokens', () => {
  const spacingFile = parseYAML(readFileSync(resolve(ROOT, 'tokens/_spacing.yaml'), 'utf-8'));

  it('has spacing scale', () => {
    expect(Object.keys(spacingFile.spacing).length).toBeGreaterThanOrEqual(10);
  });

  it('has radius scale', () => {
    expect(spacingFile.radius.none).toBe(0);
    expect(spacingFile.radius.full).toBe(9999);
  });

  it('has elevation levels', () => {
    expect(spacingFile.elevation.level0).toBe(0);
    expect(spacingFile.elevation.level5).toBe(12);
  });
});

// ─── Generated typography/spacing tests ─────────────────────────────────────

describe('Generated Dart typography', () => {
  it('dm_type_scale.g.dart has DmTypeScale class', () => {
    const content = readFileSync(resolve(ROOT, 'generated/dart/dm_type_scale.g.dart'), 'utf-8');
    expect(content).toContain('abstract final class DmTypeScale');
    expect(content).toContain('static const TextStyle displayLarge');
    expect(content).toContain('fontSize: 57');
    expect(content).toContain('FontWeight.w400');
  });
});

describe('Generated Dart spacing', () => {
  it('dm_spacing.g.dart has DmSpacing, DmRadius, DmElevation', () => {
    const content = readFileSync(resolve(ROOT, 'generated/dart/dm_spacing.g.dart'), 'utf-8');
    expect(content).toContain('abstract final class DmSpacing');
    expect(content).toContain('abstract final class DmRadius');
    expect(content).toContain('abstract final class DmElevation');
    expect(content).toContain('static const double s4 = 16');
    expect(content).toContain('static const double md = 12');
    expect(content).toContain('static const double level3 = 6');
  });
});

describe('Generated CSS spacing', () => {
  it('spacing.css has custom properties', () => {
    const content = readFileSync(resolve(ROOT, 'generated/spacing.css'), 'utf-8');
    expect(content).toContain('--spacing-4: 16px');
    expect(content).toContain('--radius-md: 12px');
    expect(content).toContain('--elevation-level3: 6px');
  });
});

describe('Generated TS typography', () => {
  it('typography.generated.ts has typeScale export', () => {
    const content = readFileSync(resolve(ROOT, '../duskmoonui/packages/core/src/themes/generated/typography.generated.ts'), 'utf-8');
    expect(content).toContain('export const typeScale');
    expect(content).toContain("'display-large'");
    expect(content).toContain('size: 57');
  });
});

describe('Generated TS spacing', () => {
  it('spacing.generated.ts has spacing/radius/elevation exports', () => {
    const content = readFileSync(resolve(ROOT, '../duskmoonui/packages/core/src/themes/generated/spacing.generated.ts'), 'utf-8');
    expect(content).toContain('export const spacing');
    expect(content).toContain('export const radius');
    expect(content).toContain('export const elevation');
  });
});

describe('Generated JSON tokens', () => {
  it('tokens.json has typeScale and spacing', () => {
    const content = JSON.parse(readFileSync(resolve(ROOT, 'generated/tokens.json'), 'utf-8'));
    expect(content.typeScale).toBeDefined();
    expect(content.typeScale['display-large'].size).toBe(57);
    expect(content.spacing).toBeDefined();
    expect(content.radius).toBeDefined();
    expect(content.elevation).toBeDefined();
  });
});

// ─── Determinism test ────────────────────────────────────────────────────────

describe('Determinism', () => {
  it('validate command exits cleanly', async () => {
    const proc = Bun.spawn(['bun', 'run', 'scripts/codegen.ts', 'validate'], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });
});
