// Utilitaires couleur (sans dépendance) : normalisation hex, luminance,
// contraste WCAG, conversions HSL / Lab et distance perceptuelle ΔE (CIE76).

/** Normalise une valeur en `#RRGGBB` majuscule, ou `null` si invalide. */
export function normalizeHex(value) {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s || /^(none|null|undefined|n\/a|-)$/i.test(s)) return null;
  s = s.replace(/^#/, '').replace(/;$/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return '#' + s.toUpperCase();
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex([r, g, b]) {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Luminance relative WCAG (0 = noir, 1 = blanc). */
export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** Ratio de contraste WCAG entre deux couleurs (1 → 21). */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastOnWhite(hex) {
  return contrastRatio(hex, '#FFFFFF');
}

export function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return [h / 6, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}

/**
 * Assombrit la couleur (baisse de la luminosité HSL par petits pas, teinte et
 * saturation conservées) jusqu'à atteindre le contraste demandé sur blanc.
 */
export function darkenToContrast(hex, min = 4.5, step = 0.01) {
  let [h, s, l] = rgbToHsl(hexToRgb(hex));
  let out = hex;
  let guard = 0;
  while (contrastOnWhite(out) < min && l > 0 && guard++ < 200) {
    l = Math.max(0, l - step);
    out = rgbToHex(hslToRgb([h, s, l]));
  }
  return out;
}

/** Vrai pour le blanc, le noir et les gris (peu ou pas de teinte). */
export function isNeutral(hex) {
  const [, s, l] = rgbToHsl(hexToRgb(hex));
  return l > 0.92 || l < 0.1 || s < 0.12;
}

export function isNearWhite(hex) {
  return rgbToHsl(hexToRgb(hex))[2] > 0.9;
}

export function isNearBlack(hex) {
  return rgbToHsl(hexToRgb(hex))[2] < 0.1;
}

/** Conversion sRGB → CIE Lab (illuminant D65). */
export function hexToLab(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** Distance perceptuelle ΔE (CIE76). ≤ 2 imperceptible, ≤ 30 même famille. */
export function deltaE(a, b) {
  const la = hexToLab(a);
  const lb = hexToLab(b);
  return Math.sqrt((la[0] - lb[0]) ** 2 + (la[1] - lb[1]) ** 2 + (la[2] - lb[2]) ** 2);
}
