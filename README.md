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
| DuskMoon | Sunshine | Light | Golden amber, muted lavender, sky blue, warm ivory |
| DuskMoon | Moonlight | Dark | Neutral white/gold |
| Ecotone | Forest | Light | Cool green/teal |
| Ecotone | Ocean | Dark | Cool blue |

Each theme carries metadata (`family`, `pair`, `description`) propagated to all generated targets. Use `pair` to look up the light/dark counterpart at runtime.

### Sunshine roles and migration

Sunshine uses golden amber for primary, **muted lavender for secondary**, sky
blue for tertiary, and soft golden yellow for accent. Lavender supersedes the
earlier coral proposal: a supporting brand role must not look like an error or
destructive action. Warm ivory/cream surfaces and warm charcoal text create a
sunlit workspace rather than an interface painted yellow. Error/destructive is
red, success is green, info is blue, and warning is deeper orange.

- Save uses gold with `primary-content`; Cancel is neutral with
  `neutral-content`; Delete is red with `error-content`. Lower-priority actions
  are not automatically secondary-colored.
- Preserve `surface = base-100`, `surface-container-low = base-200`, and
  `surface-container-high = base-300`. Use `base-content` on these three light
  bases, not all nine shades.
- Use each actual content token on its fill, and `on-*-container` on its matching
  container. Do not choose black or white independently in previews.
- A bright fill is not foreground ink. Gold is unsuitable for small text,
  necessary standalone icons, or sole selection/focus cues on ivory. The
  gallery uses `on-primary-container` for links, focus and selected markers,
  and `outline` for neutral control boundaries. Brand boundaries use
  `on-primary-container` against the fill and adjacent surface; destructive
  boundaries use `error`. `outline-variant` is for
  decorative separation, not a substitute for a control boundary.
- Labels, icons and explicit destructive wording remain necessary. Lavender
  does not guarantee separation under every color-vision condition; primary
  and warning also need semantic cues beyond hue.

### Downstream migration

Regenerate/import the updated outputs, then audit consumer assumptions about
white brand-button text, coral secondary actions, magenta accent and cool gray
surfaces. Replace fill-as-ink and hue-only selected states with suitable existing
dark roles and independently verified outlines/icons/labels. Dedicated ink,
hover and pressed state-role work belongs in downstream follow-up; this change
does **not** add `primary-ink`, `primary-hover`, `primary-active` or `focus-ring`
to the shared schema. The earlier consumer-state color suggestions are not
production tokens and are not hardcoded into the gallery.

Theme identity, pairing, shape and public keys/selectors are unchanged.
Moonlight remains the dark pair with its authored colors untouched; white/gold
brand roles and pink accent still warrant a separate semantic-continuity review.
Token validation is not proof that downstream web/Flutter integration is fixed.

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

Sunshine's required palette checks run in `validate` (also before generation)
and `check`/CI. Tests compare all 61 approved sRGB references across CSS, TS,
JSON and Dart, with at most one 8-bit channel difference; the hex references
live only in test fixtures, never in a runtime palette. YAML remains
authoritative. Unbounded linear-sRGB channels must lie in `[0, 1]` with `1e-6`
numerical tolerance before any clipping. Text uses unrounded ratios of at
least 4.5:1; meaningful outline/selection/focus contexts use at least 3:1.
Alpha is composited over the actual opaque background. Decorative separators
and arbitrary surface pairs are not subjected to a control-boundary gate.
Other themes retain their existing structural checks, with palette concerns
reported rather than recolored.

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

The gallery includes an interactive workspace, keyboard focus, action/status
roles, secondary/error and primary/warning comparisons, calculated contrast
results and a native OKLCH/generated sRGB rendering switch. Reports consume
generated JSON via the same color utilities as validation; they never maintain
a second palette. `_site/` remains ignored build output.

See [validation scope and existing other-theme follow-ups](docs/sunshine-validation.md)
and run `bun run scripts/audit-palette.ts` for the shared context report.

## License

Part of DuskMoonUI.
