# Sunshine validation and follow-ups

The approved Sunshine revision replaces coral secondary with muted lavender.
Reference hex values live only in `scripts/fixtures/sunshine-reference.json` as
regression expectations. Runtime and previews use YAML-generated output.

## Reproduce

```sh
bun run generate
bun run docs
bun run check
bun run build:pages
bun run scripts/audit-palette.ts
```

`check` and CI include the required Sunshine tests: exact public key set,
metadata/shapes, all 61 reference round trips, all four output adapters, 50%
scrim alpha, isolated repeat generation, finite/valid components, unclipped
gamut, intended contrast pairs and negative controls. Dart preserves both
`surfaceVariant` and `surfaceContainerHighest` independently, even though
Sunshine currently assigns them the same color. Cross-theme tests verify all
61 Dart color constants against their matching YAML and JSON values.
The reference fixture is not imported by the generator or gallery. Both the
original Sunshine tests and complementary `scripts/sunshine-regression.test.ts`
run in check/CI. Palette gates also run before validation/generation succeeds.
All themes now require the eight brand/semantic filled-label pairs to meet
4.5:1. `scripts/filled-contrast.test.ts` covers native-derived and generated sRGB
contrast and verifies that validation and generation reject unreadable labels.

## Measured Sunshine results

- All 61 sRGB reference colors reproduce exactly (maximum 8-bit channel error 0;
  acceptance allows 1).
- Unbounded linear-sRGB range: 0 to 1.0000000684. All channels pass the documented
  1e-6 numerical tolerance; this is measured before clipping.
- Minimum intended normal-text contrast: 4.7742:1 (required 4.5:1).
- Minimum necessary gallery cue contrast: 3.2132:1 (required 3:1), including
  necessary boundaries against every intended light surface.
- The transparent scrim remains black at 50%. Transparent contrast tests composite
  over a specified opaque background before calculating luminance; an unspecified
  background is rejected. No text is placed on the scrim in the gallery.

Ratios are compared unrounded. Both surface foregrounds are tested against all
nine intended light surfaces; base-content only against base-100/200/300.
The gallery separately shows native-derived and generated-sRGB fill/container
ratios and never substitutes automatic black/white labels.

The offset focus ring is adjacent to the surrounding surface, not the button
fill. Necessary neutral control borders use outline; brand buttons use
on-primary-container so their boundaries also contrast with the bright fill.
Selected navigation uses a dark border, a selected symbol and `aria-pressed`.
Decorative surface layering/dividers are not subject to the control threshold.

## Other themes: existing authored limitations

Design#3 corrects Moonlight's error-content chroma and darkens Forest's tertiary
and success fills while preserving their light content colors. The three
corrected tokens are inside sRGB gamut. Sunshine's approved palette is unchanged.

| Corrected pair | Native-derived contrast | Generated sRGB contrast |
|---|---|---|
| Moonlight error-content/error | 5.0571:1 | 5.0601:1 |
| Forest tertiary-content/tertiary | 4.7935:1 | 4.7931:1 |
| Forest success-content/success | 4.8759:1 | 4.8696:1 |

The remaining audit is diagnostic outside the eight filled-label pairs.
Values below use clipped sRGB for contrast when authored colors are out of
gamut, so do not establish wide-gamut rendering guarantees.

| Theme | Out-of-sRGB authored tokens | Existing text pairs below 4.5:1 |
|---|---|---|
| Moonlight | info | neutral-content/neutral 3.12; inverse-primary/inverse-surface 4.24 |
| Forest | primary, info, warning, on-warning-container, error-content, error-container | None in the evaluated text pairs |
| Ocean | primary-container, secondary-container, accent-content, inverse-primary, info-content, info-container, warning-content | None in the evaluated text pairs |

Applying the Sunshine gallery's cue contexts also reveals failures in other
themes: Moonlight and Ocean outlines on dark surfaces, bright brand-button inner
boundaries in both dark themes, Moonlight’s destructive boundary (2.57:1), and Forest's supporting-button inner boundary
(2.9924:1, still a failure). These are context-specific follow-ups, not a request
to recolor these themes or weaken Sunshine gates. The gallery displays failing
content pair results honestly when those themes are selected.

## Consumer follow-ups

Review Moonlight's neutral pair, gamut and light-to-dark semantic continuity
separately. Its primary stays white, secondary gold, tertiary blue and accent
magenta; semantic hierarchy carries across, not a mechanical hue mapping.

Downstream repositories were not modified here. The scoped Core check below
applies candidate tokens without updating its committed theme CSS; Flutter,
Phoenix and broader integration behavior remain unverified. Audit hardcoded
colors, small text/icons, real control
boundaries, focus, selection, hover, pressed and disabled states. Do not infer that
lavender solves every color-vision condition, or that primary and warning can be
distinguished by hue alone. Preserve labels and icons. Missing consumer state
roles must be addressed there, without inventing shared token keys in this change.

## Browser smoke checks

The original upstream Chrome DevTools smoke covered 1440 × 1100 desktop and
390 × 844 mobile viewports. The reconciled gallery additionally checks
1440 × 1080, 390 × 844 and 320 × 720 layouts: no document horizontal overflow,
real Tab focus on Save (3px dark outline with 3px offset), Enter activation,
keyboard navigation/disclosures, generated-sRGB switching, and authored
foregrounds on all four status containers. Necessary brand boundaries preserve
the original inner/outer contrast gates. Native and generated-sRGB pair ratios
are displayed together, and the paired-theme comparison is retained.

Latest local captures and `sunshine-browser-results.json` are outside deployment
output, in `/home/gao/.codex/visualizations/2026/09/30/01a0f2e2-a9e6-7a41-ba36-4522a0faa440/`.

For design#3 on 2026-10-26, Chromium 152 reproduced the three original failures
and passed 158 measurements with the corrected tokens: all 32 brand/semantic
filled pairs in native CSS and generated sRGB, affected Core buttons/badges/
alerts through CSS and generated-plugin entrypoints, CSS chips, and applicable
button/chip hover and pressed states. The gallery's three corrected pairs also
passed in both rendering modes at 1440 × 1080 and 390 × 844, with no horizontal
overflow or script errors. Core components were read from the existing checkout
and the candidate design tokens were injected for this check. Core still needs
to adopt these outputs and enable the all-theme filled-pair browser coverage
tracked by design#3.

These are Chromium smoke checks; other browsers and real devices remain
unverified.
