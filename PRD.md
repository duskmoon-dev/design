# PRD: @duskmoon-dev/design — Design Token Package

> **Version**: 1.0.0
> **Date**: 2026-03-27
> **Status**: Draft — Awaiting Review
> **Depends on**: Nothing (foundational package)
> **Depended on by**: `@duskmoon-dev/core`, `flutter_duskmoon_ui`

---

## 1. Overview

### Problem

DuskMoonUI's 65+ MD3 color tokens live as TypeScript objects in `@duskmoon-dev/core`. This locks the source of truth to a single platform. Adding Flutter, SwiftUI, or Compose consumers requires manual duplication with inevitable drift.

### Solution

A framework-agnostic `@duskmoon-dev/design` package containing:

1. **YAML token files** — canonical color definitions for every theme
2. **`duskmoon-codegen`** — standalone Rust CLI that reads YAML and emits TS, Dart, JSON, CSS

### Dependency Graph

```
@duskmoon-dev/design (YAML source of truth)
    │
    ├── codegen ──► @duskmoon-dev/core (TS — replaces hand-written themes)
    ├── codegen ──► flutter_duskmoon_ui (Dart — consumed by duskmoon_theme)
    ├── codegen ──► JSON / CSS (general consumption)
    └── codegen ──► (future: Swift, Kotlin, etc.)
```

---

## 2. Token File Format

### 2.1 Directory Structure

Lives inside the existing JS monorepo as a workspace package:

```
packages/design/                   # @duskmoon-dev/design
├── tokens/
│   ├── _schema.yaml              # Token structure & validation rules
│   ├── _semantic.yaml            # Shared semantic color mappings
│   ├── sunshine.yaml             # Sunshine (light) theme
│   └── moonlight.yaml            # Moonlight (dark) theme
├── generated/                    # Committed, CI-checked for staleness
│   ├── sunshine.json
│   ├── moonlight.json
│   ├── sunshine.css
│   └── moonlight.css
├── codegen.yaml                  # CLI config
├── package.json
└── README.md
```

### 2.2 Schema Definition

`tokens/_schema.yaml`:

```yaml
version: "1.0"
color_format: "hsl"  # All values: "H S% L%"

groups:
  primary:
    tokens: [primary, primary-focus, primary-content, primary-container, on-primary-container]
  secondary:
    tokens: [secondary, secondary-focus, secondary-content, secondary-container, on-secondary-container]
  tertiary:
    tokens: [tertiary, tertiary-focus, tertiary-content, tertiary-container, on-tertiary-container]
  accent:
    tokens: [accent, accent-focus, accent-content]
  neutral:
    tokens: [neutral, neutral-focus, neutral-content, neutral-variant]
  surface:
    tokens:
      - surface
      - surface-dim
      - surface-bright
      - surface-container-lowest
      - surface-container-low
      - surface-container
      - surface-container-high
      - surface-container-highest
      - surface-variant
      - on-surface
      - on-surface-variant
  base:
    description: "Legacy DaisyUI compatibility"
    tokens: [base-100, base-200, base-300, base-content]
  outline:
    tokens: [outline, outline-variant]
  inverse:
    tokens: [inverse-surface, inverse-on-surface, inverse-primary]
  shadow:
    tokens: [shadow, scrim]
  semantic:
    tokens:
      - info
      - info-content
      - success
      - success-content
      - warning
      - warning-content
      - error
      - error-content
      - error-container
      - on-error-container
```

### 2.3 Theme File

`tokens/sunshine.yaml`:

```yaml
name: sunshine
mode: light

colors:
  # Primary
  primary: "38 92% 50%"
  primary-focus: "38 92% 40%"
  primary-content: "0 0% 100%"
  primary-container: "38 100% 90%"
  on-primary-container: "38 92% 15%"

  # Secondary
  secondary: "330 81% 60%"
  secondary-focus: "330 81% 50%"
  secondary-content: "0 0% 100%"
  secondary-container: "330 100% 92%"
  on-secondary-container: "330 81% 18%"

  # Tertiary
  tertiary: "258 90% 66%"
  tertiary-focus: "258 90% 56%"
  tertiary-content: "0 0% 100%"
  tertiary-container: "258 100% 92%"
  on-tertiary-container: "258 90% 20%"

  # Accent
  accent: "160 84% 39%"
  accent-focus: "160 84% 29%"
  accent-content: "0 0% 100%"

  # Neutral
  neutral: "217 33% 17%"
  neutral-focus: "217 33% 12%"
  neutral-content: "0 0% 100%"
  neutral-variant: "220 14% 60%"

  # Surface (MD3)
  surface: "0 0% 99%"
  surface-dim: "220 13% 94%"
  surface-bright: "0 0% 100%"
  surface-container-lowest: "0 0% 100%"
  surface-container-low: "220 13% 97%"
  surface-container: "220 13% 96%"
  surface-container-high: "220 13% 94%"
  surface-container-highest: "220 13% 91%"
  surface-variant: "220 14% 90%"
  on-surface: "217 33% 17%"
  on-surface-variant: "220 9% 30%"

  # Base (legacy)
  base-100: "0 0% 100%"
  base-200: "220 13% 96%"
  base-300: "220 13% 91%"
  base-content: "217 33% 17%"

  # Outline
  outline: "220 9% 55%"
  outline-variant: "220 14% 80%"

  # Inverse
  inverse-surface: "217 33% 17%"
  inverse-on-surface: "220 13% 94%"
  inverse-primary: "38 100% 75%"

  # Shadow & Scrim
  shadow: "0 0% 0%"
  scrim: "0 0% 0%"

  # Semantic
  info: "199 89% 48%"
  info-content: "0 0% 100%"
  success: "142 71% 45%"
  success-content: "0 0% 100%"
  warning: "38 92% 50%"
  warning-content: "0 0% 100%"
  error: "0 72% 51%"
  error-content: "0 0% 100%"
  error-container: "0 100% 95%"
  on-error-container: "0 72% 20%"
```

Moonlight theme follows the same structure with values from DESIGN.md.

---

## 3. Codegen CLI — `duskmoon-codegen`

### 3.1 Repository

Separate repo: `duskmoon-dev/codegen`

```
duskmoon-dev/codegen/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs                   # CLI entry (clap derive)
│   ├── schema.rs                 # YAML schema parsing & validation
│   ├── parser.rs                 # Token YAML parser
│   ├── color.rs                  # HSL → sRGB/hex conversion
│   ├── config.rs                 # codegen.yaml parser
│   └── targets/
│       ├── mod.rs
│       ├── typescript.rs         # TS emitter
│       ├── dart.rs               # Dart emitter
│       ├── json.rs               # JSON emitter
│       └── css.rs                # CSS emitter
├── templates/                    # Tera templates for each target
│   ├── typescript.tera
│   ├── dart.tera
│   └── css.tera
├── tests/
│   ├── snapshots/                # Insta snapshot tests
│   ├── color_test.rs
│   ├── typescript_test.rs
│   └── dart_test.rs
├── .github/workflows/
│   └── release.yaml              # Cross-compile + GitHub releases
└── README.md
```

### 3.2 CLI Interface

```
duskmoon-codegen [OPTIONS] <COMMAND>

Commands:
  generate    Generate platform outputs from token YAML
  validate    Validate token files against schema
  diff        Show token diff between two themes
  docs        Generate markdown token reference

Options:
  -i, --input <DIR>       Token directory (default: ./tokens)
  -o, --output <DIR>      Output directory (default: ./generated)
  -c, --config <FILE>     Config file (default: ./codegen.yaml)

Generate:
  duskmoon-codegen generate [--target <TARGETS>...]
  Targets: typescript | dart | json | css | all
```

### 3.3 Config File

`codegen.yaml`:

```yaml
input: ./tokens
output: ./generated

targets:
  typescript:
    output_dir: ../core/src/themes/generated
    file_pattern: "{theme}.generated.ts"
    export_style: named

  dart:
    output_dir: ../../flutter_duskmoon_ui/packages/duskmoon_theme/lib/src/generated
    file_pattern: "{theme}_tokens.g.dart"
    class_prefix: DuskMoon
    color_type: Color

  json:
    output_dir: ./generated
    file_pattern: "{theme}.json"

  css:
    output_dir: ./generated
    file_pattern: "{theme}.css"
    selector_pattern: '[data-theme="{theme}"]'
    variable_prefix: "--color-"
```

### 3.4 Color Conversion

All token values stored as HSL strings. CLI converts at codegen time:

| Source (YAML) | Target | Output |
|---|---|---|
| `"38 92% 50%"` | TypeScript | `'38 92% 50%'` (pass-through) |
| `"38 92% 50%"` | Dart | `Color(0xFFF59E0B)` (HSL→sRGB→ARGB hex) |
| `"38 92% 50%"` | CSS | `hsl(38 92% 50%)` |
| `"38 92% 50%"` | JSON | `{ "h": 38, "s": 92, "l": 50, "hex": "#F59E0B" }` |

### 3.5 Generated Output Examples

**TypeScript** (`sunshine.generated.ts`):

```typescript
// GENERATED — DO NOT EDIT
// Source: tokens/sunshine.yaml
// Generator: duskmoon-codegen v1.0.0

import type { Theme } from '../types';

export const sunshine: Theme = {
  primary: '38 92% 50%',
  'primary-focus': '38 92% 40%',
  'primary-content': '0 0% 100%',
  // ... all tokens
};
```

**Dart** (`sunshine_tokens.g.dart`):

```dart
// GENERATED — DO NOT EDIT
// Source: tokens/sunshine.yaml
// Generator: duskmoon-codegen v1.0.0

import 'dart:ui' show Color;

abstract final class SunshineTokens {
  static const Color primary = Color(0xFFF59E0B);
  static const Color primaryFocus = Color(0xFFCC8400);
  static const Color primaryContent = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFFFF3CC);
  static const Color onPrimaryContainer = Color(0xFF3D2600);
  // ... all tokens
}
```

### 3.6 Crate Dependencies

```toml
[dependencies]
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
serde_yaml = "0.9"
serde_json = "1"
palette = "0.7"       # HSL → sRGB conversion
tera = "1"             # Template engine
thiserror = "2"
anyhow = "1"

[dev-dependencies]
insta = { version = "1", features = ["yaml"] }
```

---

## 4. Integration with @duskmoon-dev/core

After codegen is operational:

1. Generated TS files land in `packages/core/src/themes/generated/`
2. `packages/core/src/themes/index.ts` re-exports generated modules
3. Hand-written `sunshine.ts` / `moonlight.ts` are deleted
4. CI runs `duskmoon-codegen generate --target typescript` before `bun run build`
5. CI staleness check: regenerate, `git diff --exit-code generated/`

---

## 5. Implementation Phases

### Phase 0 — Token Extraction (1–2 weeks)

- [ ] Create `packages/design/` in JS monorepo with `package.json`
- [ ] Write `_schema.yaml` covering all 65+ tokens
- [ ] Write `sunshine.yaml` (values from DESIGN.md)
- [ ] Write `moonlight.yaml` (values from DESIGN.md)
- [ ] Write `_semantic.yaml` for shared mappings
- [ ] Manual diff validation: YAML values ≡ existing TS theme objects

### Phase 1 — Codegen CLI (2–3 weeks)

- [ ] Scaffold Rust project with clap derive CLI
- [ ] YAML schema parser + `validate` command
- [ ] HSL string → Color conversion via `palette` crate
- [ ] Tera templates for each target
- [ ] TypeScript emitter + snapshot tests
- [ ] Dart emitter + snapshot tests
- [ ] JSON emitter + snapshot tests
- [ ] CSS emitter + snapshot tests
- [ ] `codegen.yaml` config file support
- [ ] `diff` command (compare two themes)
- [ ] `docs` command (generate markdown reference)
- [ ] Cross-platform binaries: linux-x64, darwin-arm64, darwin-x64

### Phase 2 — Core Integration (1 week)

- [ ] Run codegen, generate TS into `core/src/themes/generated/`
- [ ] Integration test: `bun run build` produces identical CSS output
- [ ] Remove hand-written theme files
- [ ] CI pipeline: codegen → build → staleness check

---

## 6. Acceptance Criteria

- [ ] `duskmoon-codegen validate` passes on all token files
- [ ] Generated TS produces **byte-identical CSS** to current `@duskmoon-dev/core` build
- [ ] Generated Dart `Color` values match HSL→sRGB conversion (ΔE < 1.0)
- [ ] All 4 targets (TS, Dart, JSON, CSS) generate successfully
- [ ] Deterministic output: same input → same output, byte-for-byte
- [ ] < 5ms generation time for all targets from 2 theme files
- [ ] Cross-compiles to linux-x64, darwin-arm64, darwin-x64
- [ ] Adding a new theme = 1 YAML file + `duskmoon-codegen generate`
- [ ] Adding a new token = update `_schema.yaml` + theme files + regenerate

---

## 7. Open Questions

1. **Rust vs Go** — PRD assumes Rust (`palette` crate, `clap`, `insta`). Confirm or switch.
2. **YAML vs TOML** — Both have excellent serde support in Rust. YAML chosen for readability. Confirm.
3. **Typography tokens** — Should `@duskmoon-dev/design` also define type scale (font sizes, weights, line heights)? Or keep per-platform?
4. **Spacing / radius tokens** — Extract spacing scale, border radius, elevation values to YAML? Or per-platform?
5. **`surface-variant` deprecation** — Flutter deprecated `surfaceVariant`. Keep in YAML for CSS backward compat, or drop?

---

*End of PRD 1*
