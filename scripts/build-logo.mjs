#!/usr/bin/env node
/**
 * Fabrique tous les assets de marque à partir d'une seule image source :
 * `assets/brand/logo-source.png` (silhouette blanche sur fond noir).
 *
 *   npm run logo:build
 *
 * Produit :
 *   assets/images/icon.png                     icône iOS/web (silhouette blanche sur noir)
 *   assets/images/splash-icon.png              splash (silhouette noire, fond transparent)
 *   assets/images/favicon.png                  favicon web
 *   assets/images/android-icon-foreground.png  premier plan de l'icône adaptative
 *   assets/images/android-icon-background.png  fond de l'icône adaptative
 *   assets/images/android-icon-monochrome.png  version monochrome (Android 13+)
 *   src/components/brand/logoPath.ts           tracé vectoriel du logo, pour l'UI et les animations
 *
 * Le tracé vectoriel permet d'animer le logo (dessin progressif, dégradé aux
 * couleurs du club, transformations 3D) et de le rendre net à toute taille.
 *
 * `sharp` est fourni par la chaîne d'outils Expo (@expo/image-utils).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'assets', 'brand', 'logo-source.png');
const IMAGES = path.join(ROOT, 'assets', 'images');
const PATH_OUT = path.join(ROOT, 'src', 'components', 'brand', 'logoPath.ts');

/** Seuil de binarisation de la silhouette (source quasi binaire : 89 % noir, 11 % blanc). */
const THRESHOLD = 128;
/** Hauteur de travail du tracé : compromis entre finesse du contour et taille du chemin. */
const TRACE_HEIGHT = 620;
/** Tolérance de simplification Douglas–Peucker, en pixels de la grille de tracé. */
const SIMPLIFY_EPSILON = 0.6;
/** Contours plus petits que cette aire (px²) : bruit d'anticrénelage, ignorés. */
const MIN_CONTOUR_AREA = 6;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error(
    "✖ `sharp` est introuvable. Il est normalement installé avec Expo ; lance `npm install`.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Masque alpha
// ---------------------------------------------------------------------------

/** Silhouette source → masque alpha (blanc = opaque, noir = transparent). */
async function readMask() {
  const { data, info } = await sharp(SOURCE)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { alpha: data, width: info.width, height: info.height };
}

/** Compose la silhouette dans une couleur unie, sur fond transparent. */
function colorize({ alpha, width, height }, color) {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png();
}

/**
 * Recadre sur la silhouette puis place le logo dans un carré, avec la marge
 * demandée (0,2 = 20 % de vide autour : la « safe zone » des icônes adaptatives).
 */
async function square(image, { size, padding, background }) {
  const trimmed = await image.trim({ threshold: 1 }).toBuffer();
  const inner = Math.round(size * (1 - 2 * padding));
  const fitted = await sharp(trimmed)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: 'center' }])
    .png();
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const BLACK = { r: 18, g: 18, b: 18, alpha: 1 };

// ---------------------------------------------------------------------------
// Tracé vectoriel (marching squares + Douglas–Peucker)
// ---------------------------------------------------------------------------

/**
 * Extrait les contours fermés d'une grille binaire par marching squares.
 * Chaque cellule est lue sur ses 4 coins ; les segments produits sont ensuite
 * chaînés en polygones. Les cas ambigus (5 et 10) sont tranchés de façon
 * cohérente pour éviter les contours ouverts.
 */
function marchingSquares(grid, width, height) {
  const at = (x, y) => (x < 0 || y < 0 || x >= width || y >= height ? 0 : grid[y * width + x]);
  /** Clé d'un point demi-entier, pour chaîner les segments sans erreur d'arrondi. */
  const key = (p) => `${p[0]}:${p[1]}`;
  const starts = new Map();

  const push = (a, b) => {
    const k = key(a);
    const list = starts.get(k);
    if (list) list.push(b);
    else starts.set(k, [b]);
  };

  for (let y = -1; y < height; y++) {
    for (let x = -1; x < width; x++) {
      const tl = at(x, y);
      const tr = at(x + 1, y);
      const br = at(x + 1, y + 1);
      const bl = at(x, y + 1);
      const code = tl | (tr << 1) | (br << 2) | (bl << 3);
      if (code === 0 || code === 15) continue;

      // Milieux des arêtes de la cellule.
      const top = [x + 0.5, y];
      const right = [x + 1, y + 0.5];
      const bottom = [x + 0.5, y + 1];
      const left = [x, y + 0.5];

      // Segments orientés « intérieur à gauche » : les polygones se chaînent seuls.
      switch (code) {
        case 1: push(left, top); break;
        case 2: push(top, right); break;
        case 3: push(left, right); break;
        case 4: push(right, bottom); break;
        case 5: push(left, top); push(right, bottom); break; // selle
        case 6: push(top, bottom); break;
        case 7: push(left, bottom); break;
        case 8: push(bottom, left); break;
        case 9: push(bottom, top); break;
        case 10: push(top, right); push(bottom, left); break; // selle
        case 11: push(bottom, right); break;
        case 12: push(right, left); break;
        case 13: push(right, top); break;
        case 14: push(top, left); break;
        default: break;
      }
    }
  }

  // Chaînage des segments en polygones fermés.
  const contours = [];
  for (const [startKey, targets] of starts) {
    while (targets.length) {
      const first = startKey.split(':').map(Number);
      let current = targets.pop();
      const points = [first];
      // Garde-fou : un contour ne peut pas dépasser le nombre total de segments.
      for (let guard = 0; guard < 4 * width * height; guard++) {
        points.push(current);
        const k = key(current);
        if (k === startKey) break;
        const next = starts.get(k);
        if (!next || next.length === 0) break;
        current = next.pop();
      }
      // Seuls les contours réellement refermés sont exploitables.
      if (points.length > 3 && key(points[0]) === key(points[points.length - 1])) {
        contours.push(points);
      }
    }
  }
  return contours;
}

/** Aire algébrique d'un polygone (formule du lacet). */
function area(points) {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  }
  return Math.abs(sum) / 2;
}

/**
 * Simplification d'un contour **fermé**.
 *
 * Douglas–Peucker fige les deux extrémités ; sur un polygone fermé elles sont
 * confondues, la ligne de base est dégénérée et tous les points s'effondrent.
 * On coupe donc l'anneau en deux au point le plus éloigné du départ, on
 * simplifie chaque moitié, puis on referme.
 */
function simplifyClosed(points, epsilon) {
  const ring = points.slice(0, -1);
  if (ring.length < 4) return points;
  let anchor = 0;
  let best = -1;
  for (let i = 1; i < ring.length; i++) {
    const d = (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2;
    if (d > best) {
      best = d;
      anchor = i;
    }
  }
  const head = simplify(ring.slice(0, anchor + 1), epsilon);
  const tail = simplify(ring.slice(anchor), epsilon);
  const out = head.concat(tail.slice(1));
  out.push(out[0]);
  return out;
}

/** Simplification Douglas–Peucker d'une polyligne ouverte (itérative). */
function simplify(points, epsilon) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop();
    if (last <= first + 1) continue;
    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const norm = Math.hypot(dx, dy) || 1;
    let maxDistance = -1;
    let index = first;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      const distance = Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm;
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (maxDistance > epsilon) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Grille binaire de la source, à la hauteur de tracé demandée. */
async function traceGrid() {
  const { data, info } = await sharp(SOURCE)
    .greyscale()
    .resize({ height: TRACE_HEIGHT })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const grid = new Uint8Array(info.width * info.height);
  for (let i = 0; i < grid.length; i++) grid[i] = data[i] > THRESHOLD ? 1 : 0;
  return { grid, width: info.width, height: info.height };
}

/** Tracé complet : contours simplifiés, recadrés et normalisés dans un viewBox. */
async function buildPath() {
  const { grid, width, height } = await traceGrid();
  const contours = marchingSquares(grid, width, height)
    .map((points) => simplifyClosed(points, SIMPLIFY_EPSILON))
    .filter((points) => points.length > 3 && area(points) >= MIN_CONTOUR_AREA);

  // Recadrage sur la silhouette.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const points of contours) {
    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // Normalisation : hauteur 100 dans le viewBox, coordonnées à 2 décimales.
  const scale = 100 / (maxY - minY);
  const viewWidth = Number(((maxX - minX) * scale).toFixed(2));
  const round = (value) => Number(value.toFixed(2));

  let perimeter = 0;
  const d = contours
    .map((points) => {
      const coords = points.map(([x, y]) => [round((x - minX) * scale), round((y - minY) * scale)]);
      for (let i = 1; i < coords.length; i++) {
        perimeter += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
      }
      const [first, ...rest] = coords;
      return `M${first[0]} ${first[1]}` + rest.map(([x, y]) => `L${x} ${y}`).join('') + 'Z';
    })
    .join('');

  const totalPoints = contours.reduce((sum, points) => sum + points.length, 0);
  return { d, viewWidth, perimeter: Math.ceil(perimeter), contours: contours.length, totalPoints };
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

const mask = await readMask();
await mkdir(IMAGES, { recursive: true });
await mkdir(path.dirname(PATH_OUT), { recursive: true });

const outputs = [
  // Icône iOS / web : silhouette blanche sur noir, comme le logo d'origine.
  ['icon.png', () => square(colorize(mask, '#FFFFFF'), { size: 1024, padding: 0.16, background: BLACK })],
  // Splash : le fond est blanc (cf. app.json), la silhouette doit donc être sombre.
  ['splash-icon.png', () => square(colorize(mask, '#121212'), { size: 1024, padding: 0.1, background: TRANSPARENT })],
  ['favicon.png', () => square(colorize(mask, '#121212'), { size: 96, padding: 0.08, background: TRANSPARENT })],
  // Icône adaptative Android : 33 % de marge pour la zone de sécurité circulaire.
  ['android-icon-foreground.png', () => square(colorize(mask, '#FFFFFF'), { size: 1024, padding: 0.33, background: TRANSPARENT })],
  ['android-icon-background.png', () => sharp({ create: { width: 1024, height: 1024, channels: 4, background: BLACK } }).png()],
  ['android-icon-monochrome.png', () => square(colorize(mask, '#FFFFFF'), { size: 1024, padding: 0.33, background: TRANSPARENT })],
];

console.log('1/2 Images');
for (const [name, make] of outputs) {
  const buffer = await (await make()).toBuffer();
  await writeFile(path.join(IMAGES, name), buffer);
  console.log(`  ✔ assets/images/${name} (${Math.round(buffer.length / 1024)} Ko)`);
}

console.log('2/2 Tracé vectoriel');
const { d, viewWidth, perimeter, contours, totalPoints } = await buildPath();
const file = `/**
 * Tracé vectoriel du logo — GÉNÉRÉ par \`npm run logo:build\` depuis
 * \`assets/brand/logo-source.png\`. Ne pas modifier à la main.
 *
 * Un seul chemin, règle de remplissage \`evenodd\` : les contours intérieurs
 * (le « 10 » du maillot, les faces du ballon, la couronne) deviennent des
 * découpes. Le composant \`<Logo>\` peut donc le remplir d'une couleur, d'un
 * dégradé, ou le dessiner progressivement.
 */

/** Largeur du viewBox ; la hauteur vaut toujours 100. */
export const LOGO_VIEW_WIDTH = ${viewWidth};
export const LOGO_VIEW_HEIGHT = 100;
export const LOGO_VIEW_BOX = \`0 0 \${LOGO_VIEW_WIDTH} \${LOGO_VIEW_HEIGHT}\`;
/** Rapport largeur / hauteur, pour dimensionner le composant. */
export const LOGO_ASPECT_RATIO = LOGO_VIEW_WIDTH / LOGO_VIEW_HEIGHT;
/**
 * Longueur totale des contours, dans l'unité du viewBox.
 * Sert à animer \`strokeDasharray\` / \`strokeDashoffset\` : le logo se dessine
 * alors trait par trait avant d'être rempli.
 */
export const LOGO_PATH_LENGTH = ${perimeter};

export const LOGO_PATH =
  '${d}';
`;
await writeFile(PATH_OUT, file, 'utf8');
console.log(
  `  ✔ src/components/brand/logoPath.ts — ${contours} contours, ${totalPoints} points, ${Math.round(
    d.length / 1024,
  )} Ko`,
);
