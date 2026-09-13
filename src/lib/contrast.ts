/**
 * Utilitaires couleur purs (sans dépendance React Native) :
 * conversions hex/RGB/HSL, luminance et contraste WCAG, assombrissement automatique.
 * Utilisés par le moteur de thème et testés unitairement.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Normalise une couleur hex en `#RRGGBB` (majuscules). Retourne null si invalide. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  const match = HEX_RE.exec(value);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex.toUpperCase()}`;
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Couleur hex invalide : ${hex}`);
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return { h: h * 60, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) [rp, gp, bp] = [c, x, 0];
  else if (hue < 120) [rp, gp, bp] = [x, c, 0];
  else if (hue < 180) [rp, gp, bp] = [0, c, x];
  else if (hue < 240) [rp, gp, bp] = [0, x, c];
  else if (hue < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return rgbToHex({ r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 });
}

/** Luminance relative WCAG 2.x (0 = noir, 1 = blanc). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Ratio de contraste WCAG entre deux couleurs (1 à 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Vrai si la couleur est « claire » (luminance >= 0,5). */
export function isLight(hex: string): boolean {
  return relativeLuminance(hex) >= 0.5;
}

/**
 * Assombrit la teinte (lightness HSL) par pas de 2 % jusqu'à atteindre le contraste
 * minimal demandé sur la couleur de fond. Retourne la couleur d'origine si déjà conforme.
 */
export function darkenToContrast(hex: string, against = '#FFFFFF', minRatio = 4.5): string {
  const start = normalizeHex(hex);
  if (!start) throw new Error(`Couleur hex invalide : ${hex}`);
  if (contrastRatio(start, against) >= minRatio) return start;
  const hsl = hexToHsl(start);
  let current = start;
  let l = hsl.l;
  // Sécurité : 60 itérations max (l va de 1 à 0 par pas de 0,02, soit 50 itérations).
  for (let i = 0; i < 60 && contrastRatio(current, against) < minRatio; i += 1) {
    l = Math.max(0, l - 0.02);
    current = hslToHex({ h: hsl.h, s: hsl.s, l });
    if (l === 0) break;
  }
  return current;
}

/** Retourne la couleur avec un canal alpha (`#RRGGBBAA`). */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Couleur hex invalide : ${hex}`);
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${normalized}${a}`;
}

/** Mélange linéaire (RGB) de deux couleurs, t entre 0 et 1. */
export function mix(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const k = Math.max(0, Math.min(1, t));
  return rgbToHex({
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  });
}

/** Distance euclidienne simple en RGB (0 = identiques, > 60 = nettement différentes). */
export function rgbDistance(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}
