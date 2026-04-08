import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYAML } from 'yaml';

const ROOT = resolve(import.meta.dir, '..');
const ALL_THEMES = ['sunshine', 'moonlight', 'forest', 'ocean'];

// ─── Inline OKLCH helpers (duplicated for test independence) ────────────────

interface OklchColor {
  l: number;
  c: number;
  h: number;
  alpha?: number;
}

function parseOklch(value: string): OklchColor {
  const [colorPart, alphaPart] = value.split('/').map(s => s.trim());
  const parts = colorPart.split(/\s+/);
  return {
    l: parseFloat(parts[0].replace('%', '')) / 100,
    c: parseFloat(parts[1]),
    h: parseFloat(parts[2]),
    alpha: alphaPart ? parseFloat(alphaPart.replace('%', '')) / 100 : undefined,
  };
}

function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  return [l, c * Math.cos(hRad), c * Math.sin(hRad)];
}

function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function linearToSrgb(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function oklchToRgb(oklchStr: string): { r: number; g: number; b: number } {
  const { l, c, h } = parseOklch(oklchStr);
  const [L, a, b] = oklchToOklab(l, c, h);
  const [lr, lg, lb] = oklabToLinearSrgb(L, a, b);
  return {
    r: Math.round(linearToSrgb(lr) * 255),
    g: Math.round(linearToSrgb(lg) * 255),
    b: Math.round(linearToSrgb(lb) * 255),
  };
}

// ─── Schema tests ────────────────────────────────────────────────────────────

describe('Schema', () => {
  const schema = parseYAML(readFileSync(resolve(ROOT, 'tokens/_schema.yaml'), 'utf-8'));

  it('has version 2.0', () => {
    expect(schema.version).toBe('2.0');
  });

  it('uses oklch color format', () => {
    expect(schema.color_format).toBe('oklch');
  });

  it('defines all 11 expected groups', () => {
    const groups = Object.keys(schema.groups);
    const expected = [
      'primary', 'secondary', 'tertiary', 'accent', 'neutral',
      'surface', 'base', 'outline', 'inverse', 'shadow', 'semantic',
    ];
    for (const g of expected) {
      expect(groups).toContain(g);
    }
    expect(groups.length).toBe(11);
  });

  it('has exactly 61 color tokens total', () => {
    const allTokens = Object.values(schema.groups).flatMap((g: any) => g.tokens);
    expect(allTokens.length).toBe(61);
  });

  it('has no focus tokens', () => {
    const allTokens: string[] = Object.values(schema.groups).flatMap((g: any) => g.tokens);
    const focusTokens = allTokens.filter((t: string) => t.endsWith('-focus'));
    expect(focusTokens.length).toBe(0);
  });

  it('has shape section with 8 tokens', () => {
    expect(schema.shape).toBeDefined();
    expect(schema.shape.tokens.length).toBe(8);
    expect(schema.shape.tokens).toContain('radius-selector');
    expect(schema.shape.tokens).toContain('depth');
    expect(schema.shape.tokens).toContain('noise');
  });
});

// ─── Theme file tests ────────────────────────────────────────────────────────

for (const themeName of ALL_THEMES) {
  describe(`Theme: ${themeName}`, () => {
    const theme = parseYAML(readFileSync(resolve(ROOT, `tokens/${themeName}.yaml`), 'utf-8'));
    const schema = parseYAML(readFileSync(resolve(ROOT, 'tokens/_schema.yaml'), 'utf-8'));
    const allTokens: string[] = Object.values(schema.groups).flatMap((g: any) => g.tokens);

    it('has correct name', () => {
      expect(theme.name).toBe(themeName);
    });

    it('has valid mode', () => {
      expect(['light', 'dark']).toContain(theme.mode);
    });

    it('has family, pair, and description', () => {
      expect(typeof theme.family).toBe('string');
      expect(theme.family.length).toBeGreaterThan(0);
      expect(typeof theme.pair).toBe('string');
      expect(theme.pair.length).toBeGreaterThan(0);
      expect(typeof theme.description).toBe('string');
      expect(theme.description.length).toBeGreaterThan(0);
    });

    it('contains all schema color tokens', () => {
      for (const token of allTokens) {
        expect(theme.colors).toHaveProperty(token);
      }
    });

    it('has no extra color tokens beyond schema', () => {
      for (const token of Object.keys(theme.colors)) {
        expect(allTokens).toContain(token);
      }
    });

    it('all values match OKLCH regex', () => {
      const oklchRegex = /^\d+(\.\d+)?%\s+\d+(\.\d+)?\s+\d+(\.\d+)?(\s+\/\s+\d+(\.\d+)?%)?$/;
      for (const [key, value] of Object.entries(theme.colors)) {
        expect(value as string).toMatch(oklchRegex);
      }
    });

    it('contains all shape tokens', () => {
      expect(theme.shape).toBeDefined();
      for (const token of schema.shape.tokens) {
        expect(theme.shape).toHaveProperty(token);
      }
    });
  });
}

// ─── Theme metadata consistency ─────────────────────────────────────────────

describe('Theme metadata consistency', () => {
  const themes = ALL_THEMES.map(name =>
    parseYAML(readFileSync(resolve(ROOT, `tokens/${name}.yaml`), 'utf-8'))
  );

  it('pair references are symmetric (A→B implies B→A)', () => {
    for (const theme of themes) {
      const paired = themes.find(t => t.name === theme.pair);
      expect(paired).toBeDefined();
      expect(paired!.pair).toBe(theme.name);
    }
  });

  it('paired themes share the same family', () => {
    for (const theme of themes) {
      const paired = themes.find(t => t.name === theme.pair);
      expect(paired!.family).toBe(theme.family);
    }
  });

  it('paired themes have opposite modes (light↔dark)', () => {
    for (const theme of themes) {
      const paired = themes.find(t => t.name === theme.pair);
      expect(paired!.mode).not.toBe(theme.mode);
    }
  });
});

// ─── OKLCH to RGB conversion tests ──────────────────────────────────────────

describe('OKLCH to RGB conversion', () => {
  it('converts black: "0% 0 0" to (0, 0, 0)', () => {
    const { r, g, b } = oklchToRgb('0% 0 0');
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('converts white: "100% 0 0" to (255, 255, 255)', () => {
    const { r, g, b } = oklchToRgb('100% 0 0');
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('converts warm amber: "72% 0.17 75" to plausible RGB', () => {
    const { r, g, b } = oklchToRgb('72% 0.17 75');
    expect(r).toBeGreaterThan(180);
    expect(g).toBeGreaterThan(120);
    expect(b).toBeLessThan(50);
  });

  it('converts achromatic gray: "50% 0 0" to near-equal RGB', () => {
    const { r, g, b } = oklchToRgb('50% 0 0');
    expect(Math.abs(r - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
    expect(r).toBeGreaterThan(80);
    expect(r).toBeLessThan(140);
  });

  it('parses alpha: "0% 0 0 / 50%" yields alpha=0.5', () => {
    const parsed = parseOklch('0% 0 0 / 50%');
    expect(parsed.alpha).toBe(0.5);
  });

  it('no alpha: "72% 0.17 75" yields alpha=undefined', () => {
    const parsed = parseOklch('72% 0.17 75');
    expect(parsed.alpha).toBeUndefined();
  });
});

// ─── Generated TypeScript tests ─────────────────────────────────────────────

describe('Generated TypeScript', () => {
  for (const themeName of ALL_THEMES) {
    const genPath = resolve(ROOT, `generated/ts/${themeName}.generated.ts`);

    describe(themeName, () => {
      it('exists', () => {
        expect(existsSync(genPath)).toBe(true);
      });

      it('has GENERATED header', () => {
        const content = readFileSync(genPath, 'utf-8');
        expect(content).toContain('GENERATED — DO NOT EDIT');
      });

      it('imports from types', () => {
        const content = readFileSync(genPath, 'utf-8');
        expect(content).toContain("import type { ThemeMeta, ThemeColors");
      });

      it('exports {theme}Meta: ThemeMeta', () => {
        const content = readFileSync(genPath, 'utf-8');
        expect(content).toContain(`export const ${themeName}Meta: ThemeMeta`);
      });

      it('exports {theme}Colors: ThemeColors', () => {
        const content = readFileSync(genPath, 'utf-8');
        expect(content).toContain(`export const ${themeName}Colors: ThemeColors`);
      });

      it('exports {theme}Shape: ThemeShape', () => {
        const content = readFileSync(genPath, 'utf-8');
        expect(content).toContain(`export const ${themeName}Shape: ThemeShape`);
      });
    });
  }

  describe('types.ts', () => {
    const typesPath = resolve(ROOT, 'generated/ts/types.ts');

    it('has OklchColor type', () => {
      const content = readFileSync(typesPath, 'utf-8');
      expect(content).toContain('OklchColor');
    });

    it('has ThemeColors interface', () => {
      const content = readFileSync(typesPath, 'utf-8');
      expect(content).toContain('ThemeColors');
    });

    it('has ThemeMeta interface', () => {
      const content = readFileSync(typesPath, 'utf-8');
      expect(content).toContain('interface ThemeMeta');
    });

    it('has ThemeShape interface', () => {
      const content = readFileSync(typesPath, 'utf-8');
      expect(content).toContain('ThemeShape');
    });
  });
});

// ─── Generated JSON tests ───────────────────────────────────────────────────

describe('Generated JSON', () => {
  for (const themeName of ALL_THEMES) {
    describe(themeName, () => {
      it('has meta object with name, mode, family, pair, description', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.json`), 'utf-8');
        const data = JSON.parse(content);
        expect(data.meta).toBeDefined();
        expect(data.meta.name).toBe(themeName);
        expect(['light', 'dark']).toContain(data.meta.mode);
        expect(typeof data.meta.family).toBe('string');
        expect(typeof data.meta.pair).toBe('string');
        expect(typeof data.meta.description).toBe('string');
      });

      it('is valid JSON with colors.primary containing hex, l, c, h', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.json`), 'utf-8');
        const data = JSON.parse(content);
        expect(data.colors).toBeDefined();
        expect(data.colors.primary).toBeDefined();
        expect(data.colors.primary.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(typeof data.colors.primary.l).toBe('number');
        expect(typeof data.colors.primary.c).toBe('number');
        expect(typeof data.colors.primary.h).toBe('number');
      });

      it('has shape object with radius-selector', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.json`), 'utf-8');
        const data = JSON.parse(content);
        expect(data.shape).toBeDefined();
        expect(data.shape['radius-selector']).toBeDefined();
      });
    });
  }
});

// ─── Generated CSS tests ────────────────────────────────────────────────────

describe('Generated CSS', () => {
  for (const themeName of ALL_THEMES) {
    describe(themeName, () => {
      it('has correct data-theme selector', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
        expect(content).toContain(`[data-theme="${themeName}"]`);
      });

      it('contains --color-primary: oklch(', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
        expect(content).toContain('--color-primary: oklch(');
      });

      it('contains color-scheme', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
        expect(content).toContain('color-scheme:');
      });

      it('has GENERATED header', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
        expect(content).toContain('GENERATED — DO NOT EDIT');
      });

      it('has theme metadata custom properties', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
        expect(content).toContain('--theme-family:');
        expect(content).toContain('--theme-pair:');
      });

      it('has shape variables', () => {
        const content = readFileSync(resolve(ROOT, `generated/${themeName}.css`), 'utf-8');
        expect(content).toContain('--radius-selector:');
        expect(content).toContain('--depth:');
      });
    });
  }
});

// ─── Generated Dart tests ───────────────────────────────────────────────────

describe('Generated Dart', () => {
  for (const themeName of ALL_THEMES) {
    describe(themeName, () => {
      const dartPath = resolve(ROOT, `generated/dart/${themeName}_tokens.g.dart`);
      const className = 'DuskMoon' + themeName.charAt(0).toUpperCase() + themeName.slice(1) + 'Tokens';

      it(`has correct class name ${className}`, () => {
        const content = readFileSync(dartPath, 'utf-8');
        expect(content).toContain(`abstract final class ${className}`);
      });

      it('imports dart:ui', () => {
        const content = readFileSync(dartPath, 'utf-8');
        expect(content).toContain("import 'dart:ui'");
      });

      it('has static const Color primary', () => {
        const content = readFileSync(dartPath, 'utf-8');
        expect(content).toContain('static const Color primary = Color(0x');
      });

      it('has metadata constants', () => {
        const content = readFileSync(dartPath, 'utf-8');
        expect(content).toContain("static const String family = '");
        expect(content).toContain("static const String pair = '");
        expect(content).toContain("static const String description = '");
      });

      it('has shape constants', () => {
        const content = readFileSync(dartPath, 'utf-8');
        expect(content).toContain('static const double radiusSelector');
        expect(content).toContain('static const double depth');
      });
    });
  }

  it('surface-variant maps to surfaceContainerHighest (sunshine)', () => {
    const content = readFileSync(resolve(ROOT, 'generated/dart/sunshine_tokens.g.dart'), 'utf-8');
    expect(content).toContain('static const Color surfaceContainerHighest = Color(');
  });

  it('surfaceVariant must NOT appear (sunshine)', () => {
    const content = readFileSync(resolve(ROOT, 'generated/dart/sunshine_tokens.g.dart'), 'utf-8');
    expect(content).not.toContain('static const Color surfaceVariant = Color(');
  });
});

// ─── Typography token tests ─────────────────────────────────────────────────

describe('Typography tokens', () => {
  const typography = parseYAML(readFileSync(resolve(ROOT, 'tokens/_typography.yaml'), 'utf-8'));

  it('has type_scale key', () => {
    expect(typography.type_scale).toBeDefined();
  });

  it('contains all 15 MD3 styles', () => {
    const styles = Object.keys(typography.type_scale);
    for (const prefix of ['display', 'headline', 'title', 'body', 'label']) {
      for (const size of ['large', 'medium', 'small']) {
        expect(styles).toContain(`${prefix}-${size}`);
      }
    }
  });

  it('all entries have size, weight, line_height, letter_spacing', () => {
    for (const [, entry] of Object.entries(typography.type_scale) as [string, any][]) {
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

  it('has spacing scale with at least 10 entries', () => {
    expect(Object.keys(spacingFile.spacing).length).toBeGreaterThanOrEqual(10);
  });

  it('has radius.none=0 and radius.full=9999', () => {
    expect(spacingFile.radius.none).toBe(0);
    expect(spacingFile.radius.full).toBe(9999);
  });

  it('has elevation.level0=0 and elevation.level5=12', () => {
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
  });
});

describe('Generated TS typography', () => {
  it('typography.generated.ts has typeScale export', () => {
    const content = readFileSync(resolve(ROOT, 'generated/ts/typography.generated.ts'), 'utf-8');
    expect(content).toContain('export const typeScale');
    expect(content).toContain("'display-large'");
    expect(content).toContain('size: 57');
  });
});

describe('Generated TS spacing', () => {
  it('spacing.generated.ts has spacing/radius/elevation exports', () => {
    const content = readFileSync(resolve(ROOT, 'generated/ts/spacing.generated.ts'), 'utf-8');
    expect(content).toContain('export const spacing');
    expect(content).toContain('export const radius');
    expect(content).toContain('export const elevation');
  });
});

describe('Generated JSON tokens', () => {
  it('tokens.json has typeScale, spacing, radius, elevation', () => {
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
