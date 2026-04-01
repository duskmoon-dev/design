// GENERATED — DO NOT EDIT
// Source: tokens/_typography.yaml
// Generator: duskmoon-codegen v2.0.0

export interface TypeScaleEntry {
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing: number;
}

export const typeScale: Record<string, TypeScaleEntry> = {
  'display-large': { size: 57, weight: 400, lineHeight: 64, letterSpacing: -0.25 },
  'display-medium': { size: 45, weight: 400, lineHeight: 52, letterSpacing: 0 },
  'display-small': { size: 36, weight: 400, lineHeight: 44, letterSpacing: 0 },
  'headline-large': { size: 32, weight: 400, lineHeight: 40, letterSpacing: 0 },
  'headline-medium': { size: 28, weight: 400, lineHeight: 36, letterSpacing: 0 },
  'headline-small': { size: 24, weight: 400, lineHeight: 32, letterSpacing: 0 },
  'title-large': { size: 22, weight: 400, lineHeight: 28, letterSpacing: 0 },
  'title-medium': { size: 16, weight: 500, lineHeight: 24, letterSpacing: 0.15 },
  'title-small': { size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.1 },
  'body-large': { size: 16, weight: 400, lineHeight: 24, letterSpacing: 0.5 },
  'body-medium': { size: 14, weight: 400, lineHeight: 20, letterSpacing: 0.25 },
  'body-small': { size: 12, weight: 400, lineHeight: 16, letterSpacing: 0.4 },
  'label-large': { size: 14, weight: 500, lineHeight: 20, letterSpacing: 0.1 },
  'label-medium': { size: 12, weight: 500, lineHeight: 16, letterSpacing: 0.5 },
  'label-small': { size: 11, weight: 500, lineHeight: 16, letterSpacing: 0.5 },
} as const;
