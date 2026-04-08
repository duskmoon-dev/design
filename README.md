# @duskmoon-dev/design

[![CI](https://github.com/duskmoon-dev/design/actions/workflows/ci.yml/badge.svg)](https://github.com/duskmoon-dev/design/actions)
[![Pages](https://github.com/duskmoon-dev/design/actions/workflows/pages.yml/badge.svg)](https://duskmoon-dev.github.io/design)

Design tokens for DuskMoonUI — YAML source of truth with multi-target codegen (TypeScript, Dart, JSON, CSS).

[Interactive Token Gallery](https://duskmoon-dev.github.io/design)

## Quick Start

```bash
bun install
bun run generate    # Generate all targets
bun test            # Run tests
```

## Usage

**CSS:**
```css
@import '@duskmoon-dev/design/generated/sunshine.css';  /* theme colors + shape + metadata */
@import '@duskmoon-dev/design/generated/spacing.css';   /* spacing, radius, elevation */

body {
  color: var(--color-on-surface);
  background: var(--color-surface);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}

/* Theme metadata available as custom properties */
/* --theme-name, --theme-mode, --theme-family, --theme-pair, --theme-description */
```

**TypeScript:**
```typescript
import { sunshineMeta, sunshineColors, sunshineShape } from '@duskmoon-dev/design/generated/ts/sunshine.generated';
import { typeScale } from '@duskmoon-dev/design/generated/ts/typography.generated';
import { spacing, radius, elevation } from '@duskmoon-dev/design/generated/ts/spacing.generated';
import type { ThemeMeta, ThemeColors } from '@duskmoon-dev/design/generated/ts/types';

// Switch to dark pair
const darkTheme = sunshineMeta.pair; // → "moonlight"
```

**Dart:**
```dart
import 'package:duskmoon_design/generated/dart/sunshine_tokens.g.dart';
import 'package:duskmoon_design/generated/dart/dm_type_scale.g.dart';
import 'package:duskmoon_design/generated/dart/dm_spacing.g.dart';

// Access metadata
print(DuskMoonSunshineTokens.family);      // → "duskmoon"
print(DuskMoonSunshineTokens.pair);         // → "moonlight"
print(DuskMoonSunshineTokens.description);  // → "Warm amber/coral"
```

**JSON:**
```javascript
import sunshine from '@duskmoon-dev/design/generated/sunshine.json';
import tokens from '@duskmoon-dev/design/generated/tokens.json';  // combined: typography + spacing

sunshine.meta.family;  // → "duskmoon"
sunshine.meta.pair;    // → "moonlight"
sunshine.colors;       // → { primary: { l, c, h, hex }, ... }
```

## Tokens

### Colors (61 tokens, OKLCH)

All colors use the [OKLCH](https://oklch.com) color space — perceptually uniform across the hue spectrum.

| Group | Tokens | Purpose |
|-------|--------|---------|
| Primary | 4 | Brand color + content/container states |
| Secondary | 4 | Secondary brand |
| Tertiary | 4 | Complementary accent |
| Accent | 2 | Highlight |
| Neutral | 3 | Grays |
| Surface | 11 | Background layers (MD3 surface scale) |
| Base | 10 | Extended neutral scale (100–900) |
| Outline | 2 | Borders, dividers |
| Inverse | 3 | High-contrast states |
| Shadow | 2 | Shadows, overlays (with alpha) |
| Semantic | 12 | Info, success, warning, error + states |

### Shape (8 per-theme tokens)

`radius-selector`, `radius-field`, `radius-box`, `size-selector`, `size-field`, `border`, `depth`, `noise`

### Typography (15 MD3 styles)

Display, Headline, Title, Body, Label — each in large/medium/small.

### Spacing / Radius / Elevation

- **Spacing:** 14 steps (0–96px)
- **Radius:** 8 values (none, xs, sm, md, lg, xl, 2xl, full)
- **Elevation:** 6 levels (0–12dp)

## Themes

4 themes in 2 paired families (light + dark):

| Family | Theme | Mode | Character |
|--------|-------|------|-----------|
| DuskMoon | Sunshine | Light | Warm amber/coral |
| DuskMoon | Moonlight | Dark | Neutral white/gold |
| Ecotone | Forest | Light | Cool green/teal |
| Ecotone | Ocean | Dark | Cool blue |

Each theme carries metadata (`family`, `pair`, `description`) propagated to all generated targets. Use `pair` to look up the light/dark counterpart at runtime.

## Development

```bash
bun run generate        # All targets (TS, Dart, JSON, CSS)
bun run generate:ts     # TypeScript only
bun run validate        # Validate tokens against schema
bun test                # 142 automated tests
bun run check           # validate + test
bun run diff            # Compare themes
bun run docs            # Generate TOKENS.md
```

### Adding a theme

1. Create `tokens/mytheme.yaml` with `name`, `mode`, `family`, `pair`, `description`, all 61 colors, and 8 shape tokens
2. Ensure the paired theme's `pair` field points back to your new theme
3. Run `bun run generate`
4. Commit `tokens/mytheme.yaml` and `generated/`

### Adding a token

1. Add to `tokens/_schema.yaml` group
2. Add values to all 4 theme files
3. Run `bun run validate && bun run generate`

## License

Part of DuskMoonUI.
