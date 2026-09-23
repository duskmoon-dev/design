# Changelog

## Unreleased

### Changed

- Redesign Sunshine as a sunlit workspace: golden amber primary, muted lavender
  secondary (superseding coral to distinguish supporting and destructive roles),
  sky-blue tertiary, soft golden accent and coherent warm neutrals. Public token
  names, theme identity/pairing and shape values are unchanged; other themes are
  untouched. Regenerate CSS, TypeScript, JSON, Dart and the token reference.
- Document fill-versus-ink limits, the surface/base correspondences and downstream
  migration of content, action and interaction-state styling. Consumer integration
  remains separate; no new public state roles or package release is included.

### Added

- Required Sunshine reference-color, unclipped gamut, contrast, alpha, output
  compatibility and deterministic-generation regression tests in check/CI.
- Generated-data gallery workspace, semantic comparisons, real keyboard focus,
  native/sRGB previews and calculated filled/container contrast results.
- [Validation scope and existing other-theme follow-ups](docs/sunshine-validation.md).
