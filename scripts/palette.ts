import { inSrgbGamut, tokenContrast } from './color';

export const LIGHT_SURFACES = [
  'surface', 'surface-dim', 'surface-bright', 'surface-container-lowest',
  'surface-container-low', 'surface-container', 'surface-container-high',
  'surface-container-highest', 'surface-variant',
];
export const FILLS = ['primary', 'secondary', 'tertiary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
export const CONTAINERS = ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error'];
export interface ContrastCheck { foreground: string; background: string; minimum: number; context: string }

// Explicit intended contexts, not a claim about every possible token combination.
export const SUNSHINE_CHECKS: ContrastCheck[] = [
  ...FILLS.map(role => ({ foreground: `${role}-content`, background: role, minimum: 4.5, context: 'Filled label' })),
  ...CONTAINERS.map(role => ({ foreground: `on-${role}-container`, background: `${role}-container`, minimum: 4.5, context: 'Container label' })),
  ...LIGHT_SURFACES.flatMap(background => ['on-surface', 'on-surface-variant'].map(foreground => ({ foreground, background, minimum: 4.5, context: 'Surface text' }))),
  ...['base-100', 'base-200', 'base-300'].map(background => ({ foreground: 'base-content', background, minimum: 4.5, context: 'Base text' })),
  ...['inverse-on-surface', 'inverse-primary'].map(foreground => ({ foreground, background: 'inverse-surface', minimum: 4.5, context: 'Inverse text' })),
  // Links appear on the canvas, white card and tonal panel. Focus rings are
  // offset from controls, so the adjacent color is the surrounding surface.
  ...['surface', 'surface-container-lowest', 'surface-container'].flatMap(background => [
    { foreground: 'on-primary-container', background, minimum: 4.5, context: 'Gallery link' },
    { foreground: 'on-primary-container', background, minimum: 3, context: 'Offset keyboard focus' },
    { foreground: 'outline', background, minimum: 3, context: 'Control boundary (outside)' },
  ]),
  ...['primary', 'secondary', 'tertiary', 'surface-container-lowest'].map(background => ({ foreground: background === 'surface-container-lowest' ? 'outline' : 'on-primary-container', background, minimum: 3, context: 'Control boundary (inside)' })),
  { foreground: 'error', background: 'surface-container-lowest', minimum: 3, context: 'Destructive button boundary' },
  ...['primary-container', 'surface-container', 'surface'].map(background => ({ foreground: 'on-primary-container', background, minimum: 3, context: 'Selected border / check mark' })),
];

export function assessPalette(colors: Record<string, string>, checks = SUNSHINE_CHECKS) {
  const gamutFailures = Object.entries(colors).filter(([, value]) => !inSrgbGamut(value)).map(([key]) => key);
  const contrasts = checks.map(check => {
    const ratio = tokenContrast(colors[check.foreground], colors[check.background]);
    return { ...check, ratio, pass: ratio >= check.minimum };
  });
  return { gamutFailures, contrasts, pass: gamutFailures.length === 0 && contrasts.every(c => c.pass) };
}
