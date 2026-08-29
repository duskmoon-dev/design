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

Automated checks establish structural and generation correctness. They verify
schema completeness, recognized token names, OKLCH string shape, known pair
names, registered theme metadata relationships, and generated target behavior.

They do not currently prove:

- WCAG contrast compliance.
- Whether an OKLCH value is in the target display gamut.
- Numeric OKLCH component ranges.
- Visual balance or semantic appropriateness.

Those properties require visual and accessibility review. Passing
`bun run check` is necessary, but it is not evidence that a palette is usable.

The base validator only checks that a named pair exists. Reciprocal pairing,
shared family, and opposite modes are enforced by tests over the names in
`ALL_THEMES`; this is why registering both new variants there is part of the
theme workflow.

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
