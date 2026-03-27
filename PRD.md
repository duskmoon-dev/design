# PRD: @duskmoon-dev/design — Design Token Package

> **Version**: 2.0.0 — Final
> **Date**: 2026-03-28
> **Status**: Ready for Implementation
> **Depends on**: Nothing (foundational package)
> **Depended on by**: `@duskmoon-dev/core`, `flutter_duskmoon_ui`

---

## 1. Overview

### Problem

DuskMoonUI's 65+ MD3 color tokens live as TypeScript objects in `@duskmoon-dev/core`. This locks the source of truth to a single platform. Adding Flutter, SwiftUI, or Compose consumers requires manual duplication with inevitable drift.

### Solution

A framework-agnostic `@duskmoon-dev/design` package containing:

1. **YAML token files** — canonical definitions for colors, typography, and spacing/radius/elevation
2. **`duskmoon-codegen`** — standalone **Rust** CLI that reads YAML and emits TS, Dart, JSON, CSS

All downstream consumers are codegen-only. The YAML files are the single source of truth.

### Dependency Graph

```
@duskmoon-dev/design (YAML source of truth)
    │
    ├── codegen ──► @duskmoon-dev/core (TS — replaces hand-written themes)
    ├── codegen ──► flutter_duskmoon_ui/duskmoon_theme (Dart)
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
│   ├── _typography.yaml          # Type scale definitions
│   ├── _spacing.yaml             # Spacing, radius, elevation scales
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

### 2.2 Color Schema

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
      - surface-variant            # Kept for CSS backward compat; Dart codegen maps to surfaceContainerHighest
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

### 2.3 Typography Tokens

`tokens/_typography.yaml`:

```yaml
# Typography scale — shared across all themes
# Values are platform-agnostic; codegen maps to platform units

type_scale:
  display-large:
    size: 57        # px / logical pixels
    weight: 400
    line_height: 64
    letter_spacing: -0.25
  display-medium:
    size: 45
    weight: 400
    line_height: 52
    letter_spacing: 0
  display-small:
    size: 36
    weight: 400
    line_height: 44
    letter_spacing: 0

  headline-large:
    size: 32
    weight: 400
    line_height: 40
    letter_spacing: 0
  headline-medium:
    size: 28
    weight: 400
    line_height: 36
    letter_spacing: 0
  headline-small:
    size: 24
    weight: 400
    line_height: 32
    letter_spacing: 0

  title-large:
    size: 22
    weight: 400
    line_height: 28
    letter_spacing: 0
  title-medium:
    size: 16
    weight: 500
    line_height: 24
    letter_spacing: 0.15
  title-small:
    size: 14
    weight: 500
    line_height: 20
    letter_spacing: 0.1

  body-large:
    size: 16
    weight: 400
    line_height: 24
    letter_spacing: 0.5
  body-medium:
    size: 14
    weight: 400
    line_height: 20
    letter_spacing: 0.25
  body-small:
    size: 12
    weight: 400
    line_height: 16
    letter_spacing: 0.4

  label-large:
    size: 14
    weight: 500
    line_height: 20
    letter_spacing: 0.1
  label-medium:
    size: 12
    weight: 500
    line_height: 16
    letter_spacing: 0.5
  label-small:
    size: 11
    weight: 500
    line_height: 16
    letter_spacing: 0.5
```

### 2.4 Spacing, Radius & Elevation Tokens

`tokens/_spacing.yaml`:

```yaml
# Spacing scale
spacing:
  0: 0
  1: 4
  2: 8
  3: 12
  4: 16
  5: 20
  6: 24
  7: 28
  8: 32
  10: 40
  12: 48
  16: 64
  20: 80
  24: 96

# Border radius scale
radius:
  none: 0
  xs: 4
  sm: 8
  md: 12
  lg: 16
  xl: 20
  2xl: 28
  full: 9999

# Elevation levels (MD3 standard)
elevation:
  level0: 0         # 0dp
  level1: 1         # 1dp
  level2: 3         # 3dp
  level3: 6         # 6dp
  level4: 8         # 8dp
  level5: 12        # 12dp
```

### 2.5 Theme File

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

Separate repo: `duskmoon-dev/codegen` — **Rust**

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
│       ├── typescript.rs
│       ├── dart.rs
│       ├── json.rs
│       └── css.rs
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

| Source (YAML) | Target | Output |
|---|---|---|
| `"38 92% 50%"` | TypeScript | `'38 92% 50%'` (pass-through) |
| `"38 92% 50%"` | Dart | `Color(0xFFF59E0B)` (HSL→sRGB→ARGB hex) |
| `"38 92% 50%"` | CSS | `hsl(38 92% 50%)` |
| `"38 92% 50%"` | JSON | `{ "h": 38, "s": 92, "l": 50, "hex": "#F59E0B" }` |

### 3.5 Typography & Spacing Codegen

**Dart** — generates `DmTypeScale` class and `DmSpacing`/`DmRadius`/`DmElevation` constants:

```dart
// GENERATED — DO NOT EDIT
abstract final class DmTypeScale {
  static const TextStyle displayLarge = TextStyle(
    fontSize: 57, fontWeight: FontWeight.w400,
    height: 1.123, letterSpacing: -0.25,
  );
  // ... all styles
}

abstract final class DmSpacing {
  static const double s0 = 0;
  static const double s1 = 4;
  static const double s2 = 8;
  // ...
}

abstract final class DmRadius {
  static const double none = 0;
  static const double xs = 4;
  static const double sm = 8;
  // ...
  static const double full = 9999;
}

abstract final class DmElevation {
  static const double level0 = 0;
  static const double level1 = 1;
  // ...
}
```

**TypeScript** — generates equivalent objects for Tailwind consumption.

**CSS** — generates custom properties: `--spacing-1: 4px;`, `--radius-md: 12px;`, etc.

### 3.6 surface-variant Handling

`surface-variant` is **kept** in YAML for CSS backward compatibility. Codegen targets handle it per-platform:

| Target | Behavior |
|---|---|
| TypeScript / CSS | Emitted as `--color-surface-variant` (used by Tailwind) |
| Dart | Mapped to `surfaceContainerHighest` (Flutter deprecated `surfaceVariant`) |
| JSON | Included as normal token |

### 3.7 Generated Output Examples

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

### 3.8 Crate Dependencies

```toml
[dependencies]
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
serde_yaml = "0.9"
serde_json = "1"
palette = "0.7"
tera = "1"
thiserror = "2"
anyhow = "1"

[dev-dependencies]
insta = { version = "1", features = ["yaml"] }
```

---

## 4. Integration with @duskmoon-dev/core

1. Generated TS files land in `packages/core/src/themes/generated/`
2. `packages/core/src/themes/index.ts` re-exports generated modules
3. Hand-written `sunshine.ts` / `moonlight.ts` are deleted
4. CI runs `duskmoon-codegen generate --target typescript` before `bun run build`
5. CI staleness check: regenerate, `git diff --exit-code generated/`

---

## 5. Implementation Phases

### Phase 0 — Token Extraction (1–2 weeks)

- [x] Create `packages/design/` in JS monorepo with `package.json`
- [x] Write `_schema.yaml` covering all 65+ color tokens
- [x] Write `_typography.yaml` with MD3 type scale
- [x] Write `_spacing.yaml` with spacing, radius, elevation scales
- [x] Write `sunshine.yaml` (values from DESIGN.md)
- [x] Write `moonlight.yaml` (values from DESIGN.md)
- [x] Write `_semantic.yaml` for shared semantic mappings
- [x] Manual diff validation: YAML color values ≡ existing TS theme objects

### Phase 1 — Codegen CLI (2–3 weeks)

- [ ] Scaffold Rust project with clap derive CLI
- [x] YAML schema parser + `validate` command
- [x] HSL string → Color conversion via `palette` crate
- [ ] Tera templates for each target
- [x] TypeScript emitter (colors + typography + spacing) + snapshot tests
- [x] Dart emitter (colors + typography + spacing) + snapshot tests
- [x] JSON emitter + snapshot tests
- [x] CSS emitter + snapshot tests
- [x] `codegen.yaml` config file support
- [x] `diff` command
- [x] `docs` command
- [ ] Cross-platform binaries: linux-x64, darwin-arm64, darwin-x64

### Phase 2 — Core Integration (1 week)

- [x] Run codegen, generate TS into `core/src/themes/generated/`
- [x] Integration test: `bun run build` produces identical CSS output
- [x] Remove hand-written theme files
- [x] CI pipeline: codegen → build → staleness check

---

## 6. Acceptance Criteria

- [x] `duskmoon-codegen validate` passes on all token files
- [x] Generated TS produces **byte-identical CSS** to current `@duskmoon-dev/core` build
- [x] Generated Dart `Color` values match HSL→sRGB conversion (ΔE < 1.0)
- [x] Generated Dart `DmTypeScale` matches `_typography.yaml` values
- [x] Generated Dart `DmSpacing`/`DmRadius`/`DmElevation` match `_spacing.yaml`
- [x] All 4 targets (TS, Dart, JSON, CSS) generate successfully
- [x] Deterministic output: same input → same output, byte-for-byte
- [x] < 5ms generation time for all targets from 2 theme files
- [ ] Cross-compiles to linux-x64, darwin-arm64, darwin-x64
- [x] Adding a new theme = 1 YAML file + `duskmoon-codegen generate`
- [ ] Adding a new token = update `_schema.yaml` + theme files + regenerate
- [x] `surface-variant` emitted in CSS/TS, mapped to `surfaceContainerHighest` in Dart

---

## 7. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Codegen CLI language | **Rust** (`palette`, `clap`, `insta`) |
| 2 | Token file format | **YAML** |
| 3 | Typography tokens | **Yes** — `_typography.yaml` with MD3 type scale |
| 4 | Spacing / radius / elevation tokens | **Yes** — `_spacing.yaml` |
| 5 | `surface-variant` deprecation | **Keep** in YAML for CSS backward compat; Dart maps to `surfaceContainerHighest` |

---

*End of PRD 1*
