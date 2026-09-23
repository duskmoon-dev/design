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
print(DuskMoonSunshineTokens.description);  // → "Sunlit ivory with golden amber, muted lavender and sky blue"
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
| DuskMoon | Sunshine | Light | Sunlit ivory with golden amber, muted lavender and sky blue |
| DuskMoon | Moonlight | Dark | Neutral white/gold |
| Ecotone | Forest | Light | Cool green/teal |
| Ecotone | Ocean | Dark | Cool blue |

Each theme carries metadata (`family`, `pair`, `description`) propagated to all generated targets. Use `pair` to look up the light/dark counterpart at runtime.

## Sunshine roles and migration

Sunshine is a workspace lit by sunshine: golden amber primary, muted lavender
secondary, sky-blue tertiary, a soft golden accent, warm ivory/cream surfaces,
and warm charcoal text. Error/destructive remains red, success green, info blue,
and warning a deeper orange. **Lavender supersedes the earlier coral proposal**:
coral made supporting brand expression too similar to destructive/error red.
This does not guarantee separation under every color-vision condition; keep
labels, icons and explicit destructive wording. Gold and warning need those cues too.

A secondary action does not require secondary color. The generated-data gallery
shows gold **Save**, neutral **Cancel**, red **Delete**, and lavender supporting
expression. Status containers use their actual `on-*-container` foregrounds.

Warm-neutral correspondences are intentional:
`surface = base-100`, `surface-container-low = base-200`, and
`surface-container-high = base-300`. `base-content` is intended for the first
three base shades, not all nine. Brand fills use dark authored content tokens.

Bright primary is a **fill, not foreground ink**. Do not use it for small text,
necessary standalone icons, or the sole focus/selection cue on ivory. In this
gallery, `on-primary-container` supplies underlined links, offset keyboard focus,
selected borders/check marks and brand-button boundaries. Neutral controls and
inputs use `outline`; `outline-variant` is decorative separation. These are
explicitly tested contexts, not universal substitutions on arbitrary backgrounds.

Downstream consumers must migrate hardcoded coral/pink styling and white brand
labels to semantic tokens; audit Save/Cancel/Delete independently of brand role;
and check hover, pressed, disabled, selected and focus states against their actual
neighbors. Additional consumer state-role work remains separate: no
`primary-ink`, `primary-hover`, `primary-active` or `focus-ring` public keys were
added. Suggested future state colors are not production roles or demo overrides.
Token generation passing does **not** establish consumer integration correctness.

Sunshine and Moonlight preserve the same primary/supporting/complementary/status
semantics, but Moonlight retains white/gold/blue and a magenta accent. Its colors
are unchanged; do not assume their hues or accessibility properties mirror
Sunshine. See [palette validation and known follow-ups](docs/sunshine-validation.md).

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
