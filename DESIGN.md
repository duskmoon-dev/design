# DuskMoonUI Design Token Architecture

## Purpose

This document defines the design rules and architectural invariants of
`@duskmoon-dev/design`. It is for contributors who create themes, change the
token model, or update code generation.

The [README](./README.md) explains how to install, consume, and develop the
package. This document explains why the system is structured as it is and what
must remain true when it changes.

The authoritative machine-readable values live in [`tokens/`](./tokens/).
`DESIGN.md` deliberately does not copy those values into another token block,
because duplicated values would create a second source of truth.

## Goals

- Keep one platform-independent token source for web, Flutter, and other
  DuskMoonUI consumers.
- Give every theme a complete, coherent light and dark experience.
- Preserve the same semantic roles across TypeScript, Dart, JSON, and CSS.
- Make generated output deterministic, reviewable, and usable without running
  the generator in consuming projects.
- Make incomplete token sets and incompatible target output fail during
  repository checks.

## Non-goals

- Defining application layouts or component-specific visual design.
- Allowing target platforms to maintain independent theme values.
- Treating generated files as editable source.
- Supporting a light-only or dark-only theme family.

## System model

```text
tokens/_schema.yaml ───────────────┐
tokens/{theme}.yaml ───────────────┤
tokens/_typography.yaml ───────────┤
tokens/_spacing.yaml ──────────────┼─> scripts/codegen.ts
codegen.yaml ──────────────────────┘       │
                                          ├─> generated/ts/
                                          ├─> generated/dart/
                                          ├─> generated/*.json
                                          └─> generated/*.css
```

The YAML files are the source of truth. [`scripts/codegen.ts`](./scripts/codegen.ts)
validates them before generation, then pure emitters translate the same input
for each target. [`codegen.yaml`](./codegen.yaml) controls paths, file names,
CSS selectors, and target-specific naming.

Generated files are committed so consumers receive ready-to-use artifacts.
They must never be edited directly; changes belong in the token YAML, schema,
configuration, or generator.

## Theme family contract

A product theme is a **family**, not one YAML file. A new family must be added
as two variants in the same change: exactly one light variant and exactly one
dark variant. An unpaired variant is incomplete.

Both variants must satisfy these invariants:

| Invariant | Requirement |
|---|---|
| Family | Both use the same non-empty `family` value. |
| Mode | One uses `mode: light`; the other uses `mode: dark`. |
| Pairing | Each variant's `pair` names the other variant. The references are reciprocal. |
| Identity | The filename stem equals `name`. Use a lowercase identifier beginning with a letter and containing only letters and digits. |
| Completeness | Each variant implements every color and shape token in [`tokens/_schema.yaml`](./tokens/_schema.yaml). |

For example, the `duskmoon` family is `sunshine` (light) paired with
`moonlight` (dark), while the `ecotone` family is `forest` (light) paired with
`ocean` (dark).

The `pair` metadata is part of every generated target so consumers can switch
between the two modes without maintaining a separate theme registry.

## Foundational color roles

Every light and dark variant must use all three foundational color roles shown
in the README:

| Role | Design purpose |
|---|---|
| `primary` | The main brand color and highest-emphasis role. |
| `secondary` | A supporting brand color for lower-emphasis expression. |
| `tertiary` | A complementary color that balances the first two or provides contrasting emphasis. |

None of these roles is optional. Each one is a four-token role family:

| Role | Direct color pair | Container color pair |
|---|---|---|
| Primary | `primary` + `primary-content` | `primary-container` + `on-primary-container` |
| Secondary | `secondary` + `secondary-content` | `secondary-container` + `on-secondary-container` |
| Tertiary | `tertiary` + `tertiary-content` | `tertiary-container` + `on-tertiary-container` |

The three base colors establish the palette's identity, but the generator does
not derive the companion colors or any other token from them. Theme authors
must provide every value explicitly for both modes.

Light and dark variants do not need identical OKLCH hues or chroma. They do
need to preserve the same semantic hierarchy: primary remains primary,
secondary remains supporting, and tertiary remains complementary. Design and
review the two variants together rather than treating dark mode as a mechanical
inversion of light mode.

`tertiary` and `accent` are distinct schema roles. Tertiary belongs to the
three-color foundation; `accent` is the separate highlight role retained for
DuskMoonUI compatibility.

## Approved Sunshine direction

Sunshine is a workspace lit by sunshine, not an interface painted yellow:
golden amber primary, muted lavender secondary, sky-blue tertiary, soft golden
yellow accent, warm ivory/cream surfaces and warm charcoal neutrals. **Lavender
supersedes the earlier coral secondary proposal**, which risked confusing
supporting brand expression with errors or destructive interactions. Red is
reserved for error/destructive treatments, green for success, blue for info,
and deeper orange for warning.

An action's priority does not dictate its token family. The gallery demonstrates
gold Save, neutral Cancel and red Delete alongside lavender supporting and
sky-blue complementary actions. Use dark actual content tokens on the bright
brand fills and matching hue-family content/container pairs throughout.

The warm-neutral layers intentionally correspond: `surface = base-100`,
`surface-container-low = base-200`, `surface-container-high = base-300`.
`base-content` is intended for those light bases, not every darker base shade.
`on-surface` and `on-surface-variant` serve every intended light surface.

Bright fills are not ink. Do not use golden primary for small text, necessary
standalone icons or the sole focus/selection cue on ivory. The gallery uses
`on-primary-container` as light-surface link/focus/selected-marker ink and
`outline` as a necessary control border. `outline-variant` remains decorative;
surface layering and decorative dividers need not meet the 3:1 control-cue
threshold. Brand fill boundaries use `on-primary-container` against both the
fill and adjacent light surface; destructive boundaries use `error`. Selected
navigation has both a dark marker and an
explicit pressed state, not just a pale container.

Labels, icons and destructive wording carry semantic meaning alongside hue.
Lavender cannot guarantee discrimination for every color-vision condition;
primary/warning distinctions also need non-color cues.

Moonlight retains its authored white/gold primary/secondary and pink accent.
It shares the same role hierarchy and blue tertiary/status roles, but the brand
color shift and existing palette failures need separate review. Do not recolor
Moonlight as part of Sunshine implementation.

### Consumer-state follow-up

Consumers must migrate white-on-brand assumptions, coral secondary actions,
magenta highlights, cool neutrals, fill-as-ink and hue-only states. Audit actual
web/Flutter component boundaries, keyboard focus, selection and disabled,
hover/pressed behavior after importing the generated tokens. Dedicated ink,
hover and pressed roles remain future consumer-state work: no `primary-ink`,
`primary-hover`, `primary-active` or `focus-ring` is added to the shared schema,
and no demo-only state palette hides that gap. Generated token success does
not establish consumer integration correctness.

## Complete theme token model

At schema version 2.0, each theme variant contains:

- Metadata: `name`, `mode`, `family`, `pair`, and `description`.
- 61 color tokens across primary, secondary, tertiary, accent, neutral,
  surface, base, outline, inverse, shadow, and semantic groups.
- 8 theme-local shape tokens.

[`tokens/_schema.yaml`](./tokens/_schema.yaml) is the exhaustive contract; the
counts above describe the current schema and must not replace it as the source
of truth.

Colors use raw OKLCH values in the form `"L% C H"`. Shadow and scrim values may
include alpha as `"L% C H / A%"`. OKLCH keeps palette adjustments perceptually
meaningful while allowing each emitter to choose the representation expected by
its target.

Typography, spacing, radius, and elevation scales are shared across all themes.
Semantic role mappings are also shared, while the actual semantic colors are
provided by every theme variant.

The shared radius scale in [`tokens/_spacing.yaml`](./tokens/_spacing.yaml)
provides general-purpose size steps such as `sm`, `md`, and `lg`. Theme-local
shape tokens instead express a variant's component character: selector, field,
and box radii and sizes, plus border, depth, and noise. A theme may vary the
latter without changing the shared utility scale.

## Output contracts

| Target | Theme output | Color representation |
|---|---|---|
| TypeScript | `generated/ts/{theme}.generated.ts` | Raw OKLCH strings in typed named exports. |
| Dart | `generated/dart/{theme}_tokens.g.dart` | Converted ARGB `Color` constants. |
| JSON | `generated/{theme}.json` | Decomposed `l`, `c`, `h`, `hex`, and optional `alpha`. |
| CSS | `generated/{theme}.css` | Native `oklch(...)` custom properties under `[data-theme="{theme}"]`. |

All four targets carry the same theme metadata. Shared typography and spacing
artifacts are emitted separately.

Dart has one intentional compatibility exception: Flutter Material 3 removed
`surfaceVariant`, so Dart exposes the source `surface-variant` value as
`surfaceContainerHighest` and skips the separate
`surface-container-highest` value. CSS, TypeScript, and JSON retain both schema
tokens.

## Creating a theme family

With dependencies installed as described in the README, add a family
atomically:

1. Choose two identifier-safe names and one shared family name.
2. Design the `primary`, `secondary`, and `tertiary` roles for both light and
   dark modes, including their content and container pairs.
3. Create both `tokens/{theme}.yaml` files. Give them opposite `mode` values and
   reciprocal `pair` values.
4. Fill every color and shape token required by `tokens/_schema.yaml`; do not
   stop after the three foundational colors.
5. Add both names to `ALL_THEMES` in
   [`scripts/codegen.test.ts`](./scripts/codegen.test.ts) so the complete theme
   and pairing tests cover them.
6. Run the generation and documentation commands:

   ```bash
   bun run generate
   bun run docs
   ```

7. Run the repository checks and build the gallery:

   ```bash
   bun run check
   bun run build:pages
   ```

8. Review the light and dark variants together in the gallery. Check role
   hierarchy, surface progression, readable content/container pairs, and the
   intended visual relationship between the three foundational colors. For
   text uses, check the foreground/background pairs against WCAG 2.2 AA: at
   least 4.5:1 for normal text and 3:1 for large text.
9. Commit both source files, the test registry change, and all changed files in
   `generated/`. `_site/` is ignored deployment build output and must not be
   committed.

## Validation boundary

Automated checks establish structural and generation correctness: schema
completeness, recognized token names, known pair names, registered metadata
relationships and generated target behavior. Sunshine additionally has required
palette gates in `validate`, generation, `check` and CI:

Pure color conversion/compositing is shared in `scripts/color.ts`; intended
contexts and palette assessment live in `scripts/palette.ts`. Both the original
upstream `scripts/sunshine.test.ts` and complementary
`scripts/sunshine-regression.test.ts` run without weakening existing gates.

- Parse finite raw OKLCH components, lightness/alpha in `[0,1]`, nonnegative
  chroma and hue in `[0,360]`; there is no arbitrary universal chroma maximum.
- Inspect **unbounded linear-sRGB channels before clamping**, accepting only
  `[0,1]` with `1e-6` tolerance for matrix/decimal precision near the boundary.
- Convert the approved sRGB references programmatically to raw OKLCH with eight
  lightness/hue decimals and ten chroma decimals. Reference fixtures are
  tests only; all runtime previews consume generated data. CSS/TS raw values,
  JSON sRGB and Dart ARGB must reproduce references within one 8-bit channel.
- Require unrounded contrast >=4.5:1 for actual filled/content and
  container/content roles; both surface foregrounds on all nine intended light
  surfaces; `base-content` on the three light bases; inverse foregrounds on
  `inverse-surface`; and gallery link ink on the intended surfaces.
- Require >=3:1 for necessary outlines and gallery focus against adjacent
  surfaces, and selected navigation markers against both the selected container
  and unselected panel. Composite transparent foregrounds in display sRGB over
  the real opaque background; scrim preserves 50% alpha. Do not impose these
  thresholds on decorative dividers or all surface pairs.
- Reject unreadable and out-of-gamut negative controls. Independent primary
  color/OKLab, luminance, gamma, black/white, near-threshold and alpha reference
  cases protect against self-consistent math errors. Compare artifacts after
  repeated all-target and individual-target runs, respecting the existing Dart
  surface alias.

The gallery reports the same contexts in native OKLCH and generated sRGB,
including failures in other themes without changing their colors. Other themes
are not newly subjected to Sunshine's required gamut/contrast gate. These
checks cover named contexts, not every possible component state, color-vision
condition or integration. Visual balance and downstream accessibility still
require rendered/keyboard review; `bun run check` alone is not a global
accessibility claim.

The base validator only checks that a named pair exists. Reciprocal pairing,
shared family, and opposite modes are enforced by tests over the names in
`ALL_THEMES`; this is why registering both new variants there is part of the
theme workflow.

### Existing other-theme audit (2026-10-01)

The unchanged authored palettes at this HEAD have the following diagnostic
failures in the gallery's role contexts. These are follow-up concerns, not
new failing repository tests or a request to redesign other themes. For
out-of-sRGB values, contrast results use the clipped-sRGB diagnostic rendering,
not a guarantee about native wide-gamut display behavior.

| Theme | Out-of-sRGB authored tokens | Contrast concerns |
|---|---|---|
| Moonlight | `info`, `error-content` | Neutral fill text 3.12:1, error fill text 2.73:1; necessary outlines on nine surfaces 1.76–2.56:1; inverse-primary text 4.24:1; bright brand inner boundaries and destructive boundary also fail (17 failing contexts total). |
| Forest | `primary`, `info`, `warning`, `on-warning-container`, `error-content`, `error-container` | Tertiary fill text 3.89:1, success fill text 4.30:1; supporting-button inner boundary 2.9924:1 remains below 3:1 (3 failing contexts total). |
| Ocean | `primary-container`, `secondary-container`, `accent-content`, `inverse-primary`, `info-content`, `info-container`, `warning-content` | Necessary outlines on nine surfaces 2.22–2.81:1 and bright brand inner boundaries fail (13 failing contexts total). |

Sunshine has zero failures: minimum tested text contrast 4.7742:1,
minimum necessary cue contrast 3.2132:1, and unbounded linear channels
from 0 to 1.0000000684 (inside the documented `1e-6` tolerance). All 61 sRGB
references round-trip exactly in generated JSON/Dart (zero channel error),
including black scrim with preserved 50% source alpha / rounded ARGB `0x80`.

See [validation scope and follow-ups](docs/sunshine-validation.md) and reproduce
all diagnostics with `bun run scripts/audit-palette.ts`.

## Design decisions

- **YAML source of truth:** human-readable inputs remain independent of any
  consumer language.
- **Semantic roles:** consumers ask for meaning such as `primary` or
  `on-surface`, not a palette-specific shade number.
- **Paired modes:** every family is a complete runtime choice rather than a
  partial palette with an application-defined fallback.
- **OKLCH authoring:** lightness and chroma can be adjusted more predictably
  than in channel-oriented RGB notation.
- **Pure target emitters:** target differences stay at the translation boundary
  and cannot mutate another target's output.
- **Committed artifacts:** consumers do not need Bun or the generator, and CI
  can detect stale generated files.

## Changing the model

When adding or changing a token, update the schema and every theme variant in
the same change. Update emitters and tests when target behavior changes, then
regenerate all artifacts and run `bun run check`.

A platform-specific limitation belongs in that platform's emitter, with the
semantic source token preserved for the other targets. Do not fork the source
theme model merely to accommodate one output language.

## Related documentation

- [README](./README.md) — package usage, commands, current themes, and token
  group summary.
- [Token schema](./tokens/_schema.yaml) — exhaustive color and shape contract.
- [Generated token reference](./generated/TOKENS.md) — current values across
  themes.
- [Interactive token gallery](https://duskmoon-dev.github.io/design) — visual
  comparison of generated themes.
- [Material 3 color system](https://developer.android.com/develop/ui/compose/designsystems/material3) — inspiration for light/dark schemes and semantic color roles.
- [Design Tokens Format Module](https://www.designtokens.org/tr/2025.10/format/) — platform-independent design-token terminology and interoperability.
- [WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — minimum text contrast thresholds used during manual review.
- [OKLab conversion reference](https://bottosson.github.io/posts/oklab/) — forward/inverse linear-sRGB matrices and independent primary-color reference cases.
