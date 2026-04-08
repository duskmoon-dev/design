# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@duskmoon-dev/design` — YAML-based design tokens with multi-target code generation. Single source of truth for colors (OKLCH), typography (MD3), spacing, and shape tokens used across DuskMoonUI (web + Flutter).

## Commands

```bash
bun run generate          # Generate all targets (TS, Dart, JSON, CSS)
bun run generate:ts       # TypeScript only
bun run generate:dart     # Dart only
bun run generate:json     # JSON only
bun run generate:css      # CSS only
bun run validate          # Validate tokens against schema
bun test                  # Run tests
bun test --test-name-pattern "CSS"  # Run tests matching pattern
bun run check             # validate + test
bun run diff              # Compare themes side-by-side
bun run docs              # Generate TOKENS.md reference
bun run build:pages       # Build GitHub Pages site → _site/
```

## Architecture

**Pipeline:** YAML tokens → `scripts/codegen.ts` (Bun) → generated outputs

```
tokens/{theme}.yaml     ──→  codegen.ts  ──→  generated/ts/{theme}.generated.ts
                                         ──→  generated/dart/{theme}_tokens.g.dart
                                         ──→  generated/{theme}.json
                                         ──→  generated/{theme}.css

tokens/_typography.yaml ──→  codegen.ts  ──→  generated/ts/typography.generated.ts
tokens/_spacing.yaml    ──→              ──→  generated/ts/spacing.generated.ts
                                         ──→  generated/dart/dm_type_scale.g.dart
                                         ──→  generated/dart/dm_spacing.g.dart
                                         ──→  generated/spacing.css
                                         ──→  generated/tokens.json (combined)
```

The codegen reads `codegen.yaml` for config (input/output dirs, file patterns, selectors). Each emitter is pure — no shared mutable state between targets.

**Key files:**
- `tokens/_schema.yaml` — defines all 61 color tokens (11 groups) + 8 shape tokens
- `tokens/_typography.yaml` — 15 MD3 type scale styles (shared across themes)
- `tokens/_spacing.yaml` — spacing/radius/elevation scales (shared across themes)
- `tokens/_semantic.yaml` — semantic color role mappings
- `tokens/{theme}.yaml` — per-theme color, shape, and metadata values (4 themes)
- `scripts/codegen.ts` — the entire generation pipeline
- `scripts/codegen.test.ts` — test suite (142 tests)

## Themes

4 themes in 2 paired families, each with a light + dark variant:

- **DuskMoon:** `sunshine` (light) ↔ `moonlight` (dark)
- **Ecotone:** `forest` (light) ↔ `ocean` (dark)

Each theme YAML has 5 top-level metadata fields (`name`, `mode`, `family`, `pair`, `description`), 61 OKLCH colors, and 8 shape tokens. The `pair` field references the other theme in the same family (must be symmetric, validated at build time).

### Theme metadata in generated outputs

| Target | How metadata appears |
|--------|---------------------|
| **TS** | `{theme}Meta: ThemeMeta` export (typed object) |
| **Dart** | `static const String name/mode/family/pair/description` on token class |
| **JSON** | Top-level `meta` object: `{ name, mode, family, pair, description }` |
| **CSS** | Custom properties: `--theme-name`, `--theme-mode`, `--theme-family`, `--theme-pair`, `--theme-description` |

## OKLCH Color Format

All colors are OKLCH strings: `"L% C H"` or `"L% C H / A%"` (alpha only for shadow/scrim).

Conversion pipeline: `OKLCH → OKLab → Linear sRGB → sRGB → Hex`

Target handling:
- **CSS**: `oklch(58% 0.18 35)` — native CSS function
- **TypeScript**: `"58% 0.18 35"` — raw OKLCH string
- **Dart**: `Color(0xFFCE4522)` — converted to ARGB hex
- **JSON**: decomposed `{ l, c, h, hex, alpha? }`

## Non-Obvious Patterns

**surface-variant aliasing in Dart:** Flutter M3 removed `surfaceVariant`. Codegen maps it to `surfaceContainerHighest` in Dart via `DART_ALIASES`, while CSS/TS keep both for backward compat. See the `DART_SKIP` set in codegen.ts.

**Kebab→camelCase:** `primary-container` → `primaryContainer` everywhere except CSS. Dart numeric keys get prefixed if they start with a digit.

**Shape token coercion:** Shape values can be strings (`"0.25rem"`) or numbers (`0.9`). Dart codegen converts `rem` → px (×16) for `double` constants.

**Staleness check in CI:** After `bun run generate`, CI runs `git diff --exit-code generated/`. Always regenerate and commit if you modify any token YAML.

**Generated files are committed:** The `generated/` directory is checked into git. Do not edit those files — they are overwritten on every `bun run generate`.

**Pair validation:** The validator checks that each theme's `pair` references an existing theme, that paired themes share the same `family`, and tests enforce symmetry (A→B implies B→A) and opposite modes (light↔dark).

## GitHub Pages

`docs/index.html` is a template with `__THEME_DATA__` / `__SHARED_DATA__` placeholders. `scripts/build-pages.ts` injects JSON data and writes to `_site/index.html`. The Pages workflow deploys `_site/` via `actions/deploy-pages`.
