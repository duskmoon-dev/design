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
@import '@duskmoon-dev/design/generated/sunset.css';
@import '@duskmoon-dev/design/generated/spacing.css';

body {
  color: var(--color-on-surface);
  background: var(--color-surface);
  padding: var(--spacing-4);
}
```

**TypeScript:**
```typescript
import { sunsetColors, sunsetShape } from '@duskmoon-dev/design/generated/ts/sunset.generated';
import type { ThemeColors } from '@duskmoon-dev/design/generated/ts/types';
```

**Dart:**
```dart
import 'package:duskmoon_design/generated/dart/sunset_tokens.g.dart';
import 'package:duskmoon_design/generated/dart/dm_type_scale.g.dart';
import 'package:duskmoon_design/generated/dart/dm_spacing.g.dart';
```

**JSON:**
```javascript
import sunset from '@duskmoon-dev/design/generated/sunset.json';
import tokens from '@duskmoon-dev/design/generated/tokens.json';
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

| Theme | Mode | Character |
|-------|------|-----------|
| Sunset | Light | Warm orange/coral |
| Sunshine | Light | Warm amber/coral |
| Forest | Light | Cool green/teal |
| Moonlight | Dark | Neutral white/gold |
| Ocean | Dark | Cool blue |

## Development

```bash
bun run generate        # All targets (TS, Dart, JSON, CSS)
bun run generate:ts     # TypeScript only
bun run validate        # Validate tokens against schema
bun test                # 140 automated tests
bun run check           # validate + test
bun run diff            # Compare themes
bun run docs            # Generate TOKENS.md
```

### Adding a theme

1. Create `tokens/mytheme.yaml` with `name`, `mode`, all 61 colors, and 8 shape tokens
2. Run `bun run generate`
3. Commit `tokens/mytheme.yaml` and `generated/`

### Adding a token

1. Add to `tokens/_schema.yaml` group
2. Add values to all 5 theme files
3. Run `bun run validate && bun run generate`

## License

Part of DuskMoonUI.
