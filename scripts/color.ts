// Pure color math shared by code generation and palette validation.
export interface OklchColor {
  l: number;   // 0–1
  c: number;   // Non-negative; gamut depends on lightness and hue
  h: number;   // 0–360
  alpha?: number; // 0–1
}

export function parseOklch(value: string): OklchColor {
  const match = /^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s+\/\s+(\d+(?:\.\d+)?)%)?$/.exec(value);
  if (!match) throw new Error(`Invalid OKLCH: ${value}`);
  const l = Number(match[1]) / 100, c = Number(match[2]), h = Number(match[3]);
  const alpha = match[4] === undefined ? undefined : Number(match[4]) / 100;
  if (![l, c, h, alpha ?? 1].every(Number.isFinite) || l > 1 || (alpha ?? 1) > 1)
    throw new Error(`Invalid OKLCH components: ${value}`);
  return { l, c, h, alpha };
}

export function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  return [l, c * Math.cos(hRad), c * Math.sin(hRad)];
}

export function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

export function linearToSrgb(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

export function oklchToRgb(oklchStr: string): { r: number; g: number; b: number } {
  const { l, c, h } = parseOklch(oklchStr);
  const [L, a, b] = oklchToOklab(l, c, h);
  const [lr, lg, lb] = oklabToLinearSrgb(L, a, b);
  return {
    r: Math.round(linearToSrgb(lr) * 255),
    g: Math.round(linearToSrgb(lg) * 255),
    b: Math.round(linearToSrgb(lb) * 255),
  };
}

export function oklchToHex(oklchStr: string): string {
  const { r, g, b } = oklchToRgb(oklchStr);
  return rgbToHex(r, g, b);
}

export function oklchToArgbHex(oklchStr: string): string {
  const parsed = parseOklch(oklchStr);
  const { r, g, b } = oklchToRgb(oklchStr);
  const alpha = parsed.alpha !== undefined ? Math.round(parsed.alpha * 255) : 255;
  return '0x' + [alpha, r, g, b]
    .map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

// Matrix rounding and decimal serialization can move boundary colors by <1e-6.
// Check these UNBOUNDED channels before the output adapters clamp to sRGB.
export const GAMUT_TOLERANCE = 1e-6;
export type Rgb = [number, number, number]; // encoded sRGB, 0–1

export function oklchToLinearSrgb(value: string): Rgb {
  const { l, c, h } = parseOklch(value);
  return oklabToLinearSrgb(...oklchToOklab(l, c, h));
}

export function inSrgbGamut(value: string): boolean {
  try {
    return oklchToLinearSrgb(value).every(v =>
      Number.isFinite(v) && v >= -GAMUT_TOLERANCE && v <= 1 + GAMUT_TOLERANCE);
  } catch { return false; }
}

export function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): Rgb {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid sRGB hex: ${hex}`);
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
}

// Inverse of the OKLab matrices above (Björn Ottosson's reference conversion).
export function hexToOklch(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const s = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  const L = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s;
  const a = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s;
  const B = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s;
  const c = Math.hypot(a, B);
  // Achromatic colors have no meaningful hue; remove matrix residuals.
  return c < 1e-7 ? `${(L*100).toFixed(8)}% 0 0`
    : `${(L*100).toFixed(8)}% ${c.toFixed(10)} ${((Math.atan2(B,a)*180/Math.PI+360)%360).toFixed(8)}`;
}

export function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

export function contrast(a: Rgb, b: Rgb): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x,y)+0.05) / (Math.min(x,y)+0.05);
}

// CSS source-over compositing in encoded sRGB, BEFORE WCAG linearization.
export function composite(foreground: Rgb, alpha: number, background: Rgb): Rgb {
  return foreground.map((v,i) => v*alpha + background[i]*(1-alpha)) as Rgb;
}

export function tokenContrast(foreground: string, background: string, canvas?: string): number {
  const rgb = (v: string) => oklchToLinearSrgb(v).map(linearToSrgb) as Rgb;
  const bgAlpha = parseOklch(background).alpha ?? 1;
  let bg = rgb(background);
  if (bgAlpha < 1) {
    if (!canvas || (parseOklch(canvas).alpha ?? 1) !== 1)
      throw new Error('Transparent background needs an opaque canvas');
    bg = composite(bg, bgAlpha, rgb(canvas));
  }
  const fg = composite(rgb(foreground), parseOklch(foreground).alpha ?? 1, bg);
  return contrast(fg, bg);
}
