# Changelog

## Unreleased

### Changed

- Implement the approved Sunshine palette in authoritative raw OKLCH YAML and
  regenerate CSS, TypeScript, JSON, Dart and the token reference. Golden amber
  primary, muted lavender secondary (superseding rejected coral), sky-blue
  tertiary and golden-yellow accent sit on warm ivory/cream/charcoal neutrals.
- Preserve theme identity/pairing, shape values, public keys/selectors and
  target adapter compatibility. Other themes' authored colors are unchanged.
- Keep warm-neutral mappings: surface/base-100, surface-container-low/base-200,
  surface-container-high/base-300. Reserve red for error/destructive, green for
  success, blue for info and deeper orange for warning.

### Added

- Required Sunshine preclamp sRGB gamut and context-specific contrast gates,
  reference round-trip, finite/malformed, negative-control, alpha, independent
  color-math and deterministic multi-target regression tests in check/CI.
- Generated-data workspace preview with gold Save, neutral Cancel, red Delete,
  lavender/sky-blue supporting roles, labeled/icon status containers, selected
  navigation, real keyboard focus, paired contrast results and native
  OKLCH/generated sRGB comparison at desktop/mobile widths.
- Preserve upstream color-math APIs, palette assessment/audit tooling and
  original regression tests when reconciling the Sunshine implementations;
  extend their cue gates to all intended light surfaces and selected panels.
- [Validation scope and existing other-theme follow-ups](docs/sunshine-validation.md).

### Migration Notes

- Bright fills are not ink. Audit consumer white-on-brand text, coral secondary,
  magenta accent, cool surfaces, fill-as-ink and hue-only focus/selection. Use
  existing suitable dark ink and meaningful outlines; decorative separators
  remain separate. Labels/icons/destructive wording remain necessary beyond hue.
- Dedicated downstream ink/hover/pressed state roles still need work; no new
  shared schema roles or hardcoded demo-state colors are introduced. Moonlight
  remains unchanged, with semantic-continuity/palette concerns left for separate
  review. Token generation does not prove downstream component integration.
