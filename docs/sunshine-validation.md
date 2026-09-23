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
gamut, intended contrast pairs and negative controls. The Dart
`surface-variant` → `surfaceContainerHighest` alias remains intentional.
The reference fixture is not imported by the generator or gallery.

## Measured Sunshine results

- All 61 sRGB reference colors reproduce exactly (maximum 8-bit channel error 0;
  acceptance allows 1).
- Unbounded linear-sRGB range: 0 to 1.0000000684. All channels pass the documented
  1e-6 numerical tolerance; this is measured before clipping.
- Minimum intended normal-text contrast: 4.7742:1 (required 4.5:1).
- Minimum necessary gallery cue contrast: 3.7760:1 (required 3:1).
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
Selected navigation uses a dark border, a check mark and `aria-current`.
Decorative surface layering/dividers are not subject to the control threshold.

## Other themes: existing authored limitations

The audit is diagnostic for other themes; their authored YAML and generated
colors are unchanged. Values below use clipped sRGB for contrast when authored
colors are out of gamut, so do not establish wide-gamut rendering guarantees.

| Theme | Out-of-sRGB authored tokens | Existing text pairs below 4.5:1 |
|---|---|---|
| Moonlight | info, error-content | neutral-content/neutral 3.12; error-content/error 2.73; inverse-primary/inverse-surface 4.24 |
| Forest | primary, info, warning, on-warning-container, error-content, error-container | tertiary-content/tertiary 3.89; success-content/success 4.30 |
| Ocean | primary-container, secondary-container, accent-content, inverse-primary, info-content, info-container, warning-content | None in the evaluated text pairs |

Applying the Sunshine gallery's cue contexts also reveals failures in other
themes: Moonlight and Ocean outlines on dark surfaces, bright brand-button inner
boundaries in both dark themes, Moonlight’s destructive boundary (2.57:1), and Forest's supporting-button inner boundary
(2.9924:1, still a failure). These are context-specific follow-ups, not a request
to recolor these themes or weaken Sunshine gates. The gallery displays failing
content pair results honestly when those themes are selected.

## Consumer follow-ups

Review Moonlight's neutral/error pairs, gamut and light-to-dark semantic continuity
separately. Its primary stays white, secondary gold, tertiary blue and accent
magenta; semantic hierarchy carries across, not a mechanical hue mapping.

Web, Flutter, Phoenix and other downstream component integrations were not modified
or validated here. Audit their hardcoded colors, small text/icons, real control
boundaries, focus, selection, hover, pressed and disabled states. Do not infer that
lavender solves every color-vision condition, or that primary and warning can be
distinguished by hue alone. Preserve labels and icons. Missing consumer state
roles must be addressed there, without inventing shared token keys in this change.

## Browser smoke checks

Chrome DevTools checks passed at a 1440 × 1100 desktop viewport and a
390 × 844 mobile emulation viewport: no document horizontal overflow, real Tab
focus on Save (3px dark outline with 4px offset), Enter activation, generated
sRGB switching, and actual rendered content pairs ≥ 4.5:1. All four status
containers are present with authored foregrounds; no browser console errors
were observed. Sunshine/Moonlight were reviewed side by side. Captures are local
ignored artifacts in `_site/`: `sunshine-desktop.png`, `sunshine-mobile.png`,
and `sunshine-moonlight.png`.

This is a Chromium smoke check, not a cross-browser or real-device matrix.
Downstream consumer integrations remain untested.
