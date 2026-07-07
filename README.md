# @duskmoon-dev/design

[![CI](https://github.com/duskmoon-dev/design/actions/workflows/ci.yml/badge.svg)](https://github.com/duskmoon-dev/design/actions)
[![Pages](https://github.com/duskmoon-dev/design/actions/workflows/pages.yml/badge.svg)](https://duskmoon-dev.github.io/design)

Design tokens for DuskMoonUI. This package keeps YAML token files as the source of truth and generates TypeScript, Dart, JSON, and CSS outputs for web and Flutter consumers.

[Interactive Token Gallery](https://duskmoon-dev.github.io/design)

## Quick Start

```bash
bun install
bun run generate
bun run check
```

## Package Contents

| Path | Purpose |
|------|---------|
| `tokens/` | Source YAML for themes, typography, spacing, radius, elevation, and schema |
| `scripts/codegen.ts` | Generator and validator for all output targets |
| `generated/` | Committed generated package artifacts |
| `docs/index.html` | GitHub Pages gallery template |
| `_site/` | Built GitHub Pages output from `bun run build:pages` |

The generated files are committed so package consumers do not need to run codegen.

## Used By

These DuskMoon projects use this design token package:

| Repository | Purpose |
|------------|---------|
| [`duskmoon-elements`](https://github.com/duskmoon-dev/duskmoon-elements) | Web Components |
| [`duskmoon-react`](https://github.com/duskmoon-dev/duskmoon-react) | React components |
| [`duskmoonui`](https://github.com/duskmoon-dev/duskmoonui) | Core DuskMoon UI |
| [`flutter-duskmoon-ui`](https://github.com/duskmoon-dev/flutter-duskmoon-ui) | Flutter UI components |
| [`phoenix-duskmoon-ui`](https://github.com/duskmoon-dev/phoenix-duskmoon-ui) | Phoenix UI components |
| [`yew-duskmoon-ui`](https://github.com/duskmoon-dev/yew-duskmoon-ui) | Yew UI components |

## Using Tokens

### CSS

```css
@import '@duskmoon-dev/design/generated/sunshine.css';
@import '@duskmoon-dev/design/generated/spacing.css';

body {
  color: var(--color-on-surface);
  background: var(--color-surface);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}

/* Theme metadata available as custom properties */
/* --theme-name, --theme-mode, --theme-family, --theme-pair, --theme-description */
```

### TypeScript

```typescript
import { sunshineMeta, sunshineColors, sunshineShape } from '@duskmoon-dev/design/generated/ts/sunshine.generated';
import { typeScale } from '@duskmoon-dev/design/generated/ts/typography.generated';
import { spacing, radius, elevation } from '@duskmoon-dev/design/generated/ts/spacing.generated';
import type { ThemeMeta, ThemeColors } from '@duskmoon-dev/design/generated/ts/types';

// Switch to dark pair
const darkTheme = sunshineMeta.pair; // → "moonlight"
```

### Dart

```dart
import 'package:duskmoon_design/generated/dart/sunshine_tokens.g.dart';
import 'package:duskmoon_design/generated/dart/dm_type_scale.g.dart';
import 'package:duskmoon_design/generated/dart/dm_spacing.g.dart';

// Access metadata
print(DuskMoonSunshineTokens.family);      // → "duskmoon"
print(DuskMoonSunshineTokens.pair);         // → "moonlight"
print(DuskMoonSunshineTokens.description);  // → "Warm amber/coral"
```

### JSON

```javascript
import sunshine from '@duskmoon-dev/design/generated/sunshine.json';
import tokens from '@duskmoon-dev/design/generated/tokens.json';

sunshine.meta.family;  // → "duskmoon"
sunshine.meta.pair;    // → "moonlight"
sunshine.colors;       // → { primary: { l, c, h, hex }, ... }
tokens.typeScale;      // shared type scale
tokens.spacing;        // shared spacing, radius, elevation
```

## Token Model

### Theme Tokens

Each theme file in `tokens/{theme}.yaml` contains metadata, 61 OKLCH color tokens, and 8 shape tokens.

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
| Semantic | 16 | Info, success, warning, error + states |

All colors use the [OKLCH](https://oklch.com) color space for perceptually uniform color adjustment. Shadow and scrim tokens may include alpha values.

Shape tokens are per-theme:

`radius-selector`, `radius-field`, `radius-box`, `size-selector`, `size-field`, `border`, `depth`, `noise`

### Shared Tokens

Shared token files apply to every theme:

| Source | Contents |
|--------|----------|
| `tokens/_typography.yaml` | 15 Material Design 3 type scale styles |
| `tokens/_spacing.yaml` | Spacing, radius, and elevation scales |
| `tokens/_semantic.yaml` | Semantic color role mappings |
| `tokens/_schema.yaml` | Color and shape token schema |

## Themes

4 themes in 2 paired families (light + dark):

| Family | Theme | Mode | Character |
|--------|-------|------|-----------|
| DuskMoon | Sunshine | Light | Warm amber/coral |
| DuskMoon | Moonlight | Dark | Neutral white/gold |
| Ecotone | Forest | Light | Cool green/teal |
| Ecotone | Ocean | Dark | Cool blue |

Each theme carries metadata (`family`, `pair`, `description`) propagated to all generated targets. Use `pair` to look up the light/dark counterpart at runtime.

## Generated Outputs

| Target | Output |
|--------|--------|
| TypeScript | `generated/ts/{theme}.generated.ts`, shared `spacing.generated.ts`, `typography.generated.ts`, and `types.ts` |
| Dart | `generated/dart/{theme}_tokens.g.dart`, `dm_spacing.g.dart`, and `dm_type_scale.g.dart` |
| JSON | `generated/{theme}.json` plus combined shared tokens in `generated/tokens.json` |
| CSS | `generated/{theme}.css` and `generated/spacing.css` |
| Markdown | `generated/TOKENS.md` reference from `bun run docs` |

## Development

```bash
bun run generate        # All targets (TS, Dart, JSON, CSS)
bun run generate:ts     # TypeScript only
bun run generate:dart   # Dart only
bun run generate:json   # JSON only
bun run generate:css    # CSS only
bun run validate        # Validate tokens against schema
bun test                # Run tests
bun run check           # validate + test
bun run diff            # Compare themes
bun run docs            # Generate TOKENS.md
bun run build:pages     # Build _site/ for GitHub Pages
```

### Codegen pipeline

```text
tokens/*.yaml
  -> scripts/codegen.ts
  -> generated/ts/
  -> generated/dart/
  -> generated/*.json
  -> generated/*.css
```

`codegen.yaml` controls input/output directories, file patterns, and CSS selector naming.

### Adding a theme

1. Create `tokens/mytheme.yaml` with `name`, `mode`, `family`, `pair`, `description`, all 61 colors, and all 8 shape tokens
2. Ensure the paired theme points back to the new theme with its own `pair` field
3. Run `bun run generate`
4. Run `bun run check`
5. Commit `tokens/mytheme.yaml` and `generated/`

### Adding a token

1. Add the token to the relevant group in `tokens/_schema.yaml`
2. Add values to all 4 theme files
3. Update generator/tests if the new token requires target-specific behavior
4. Run `bun run generate`
5. Run `bun run check`

## GitHub Pages

`docs/index.html` is the gallery template. `bun run build:pages` injects generated token data and writes `_site/index.html`, which the Pages workflow deploys.

## License

Part of DuskMoonUI.
