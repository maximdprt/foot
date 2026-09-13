// Accès à l'API MediaWiki et parsing (robuste aux modèles imbriqués) :
// infobox d'un club / d'une sélection, table des stades d'une page de saison.

export function apiUrl(lang, params) {
  return (
    `https://${lang}.wikipedia.org/w/api.php?` +
    new URLSearchParams({ format: 'json', formatversion: '2', redirects: '1', ...params }).toString()
  );
}

/**
 * Récupère le wikitexte d'une page (+ le lien interlangue demandé).
 * Retourne `null` si la page n'existe pas.
 */
export async function fetchPage(http, title, lang = 'en', langlinkTo = null) {
  const params = { action: 'query', titles: title, prop: 'revisions', rvprop: 'content', rvslots: 'main' };
  if (langlinkTo) {
    params.prop += '|langlinks';
    params.lllang = langlinkTo;
    params.lllimit = '1';
  }
  const data = await http.fetchJson(apiUrl(lang, params));
  const page = data?.query?.pages?.[0];
  if (!page || page.missing || !page.revisions?.length) return null;
  return {
    title: page.title,
    content: page.revisions[0].slots.main.content,
    langlink: page.langlinks?.[0]?.title ?? null,
  };
}

/** Extrait le texte complet (accolades incluses) du premier modèle dont le nom matche `nameRegex`. */
export function extractTemplate(content, nameRegex) {
  const re = new RegExp('\\{\\{\\s*' + nameRegex.source, nameRegex.flags.includes('i') ? 'i' : '');
  const m = re.exec(content);
  if (!m) return null;
  let depth = 0;
  for (let i = m.index; i < content.length - 1; i++) {
    const two = content.slice(i, i + 2);
    if (two === '{{') {
      depth++;
      i++;
    } else if (two === '}}') {
      depth--;
      i++;
      if (depth === 0) return content.slice(m.index, i + 1);
    }
  }
  return null;
}

/** Découpe une chaîne sur `separator` uniquement à profondeur 0 ({{ }} et [[ ]]). */
export function splitTopLevel(text, separator = '|') {
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const two = text.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      current += two;
      i++;
      continue;
    }
    if (two === '}}' || two === ']]') {
      depth--;
      current += two;
      i++;
      continue;
    }
    if (depth === 0 && text[i] === separator) {
      parts.push(current);
      current = '';
      continue;
    }
    current += text[i];
  }
  parts.push(current);
  return parts;
}

/** Paramètres nommés d'un modèle → objet { clé (minuscule, espaces normalisés) : valeur brute }. */
export function parseTemplateParams(templateText) {
  const inner = templateText.slice(2, -2);
  const parts = splitTopLevel(inner, '|');
  const params = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim().toLowerCase().replace(/\s+/g, ' ');
    const value = part.slice(eq + 1).trim();
    if (key) params[key] = value;
  }
  return params;
}

/** Retire le balisage wiki courant pour obtenir du texte lisible. */
export function stripMarkup(text) {
  if (!text) return '';
  let out = text;
  out = out.replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/<br\s*\/?>/gi, ' ');
  out = out.replace(/<[^>]+>/g, '');
  // {{nowrap|x}} / {{sort|k|x}} / {{lang|fr|x}} → dernier argument
  for (let i = 0; i < 5 && /\{\{/.test(out); i++) {
    out = out.replace(/\{\{([^{}]*)\}\}/g, (_, body) => {
      const args = splitTopLevel(body, '|');
      const name = args[0].trim().toLowerCase();
      if (['flagicon', 'flag icon', 'flagu', 'flagicon image', 'increase', 'decrease', 'small'].includes(name) && args.length < 3) return '';
      return args.length > 1 ? args[args.length - 1].replace(/^[^=]*=/, '') : '';
    });
  }
  out = out.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1');
  out = out.replace(/'{2,}/g, '').replace(/&nbsp;/g, ' ');
  return out.replace(/\s+/g, ' ').trim();
}

/** Premier lien interne [[Article|Libellé]] d'un fragment (liens de fichiers ignorés). */
export function firstWikilink(text) {
  const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;
  let m;
  while ((m = re.exec(text))) {
    const article = m[1].trim();
    if (/^(file|image|fichier|category|catégorie):/i.test(article)) continue;
    const label = stripMarkup(m[2] ?? article) || article;
    return { article, label };
  }
  return null;
}

/** Contenu utile d'une cellule de tableau : retire les attributs (`style="…" |`). */
function cellContent(cell) {
  const parts = splitTopLevel(cell, '|');
  if (parts.length > 1 && /=/.test(parts[0]) && !/\[\[|\{\{/.test(parts[0])) return parts.slice(1).join('|').trim();
  return cell.trim();
}

/** Toutes les tables `{| class="wikitable…" … |}` d'un wikitexte (texte intérieur). */
function findTables(content) {
  const tables = [];
  const re = /\{\|[^\n]*wikitable[^\n]*\n/g;
  let m;
  while ((m = re.exec(content))) {
    let depth = 1;
    let i = m.index + m[0].length;
    for (; i < content.length - 1; i++) {
      if (content.startsWith('{|', i)) depth++;
      else if (content.startsWith('|}', i)) {
        depth--;
        if (depth === 0) break;
      }
    }
    tables.push(content.slice(m.index + m[0].length, i));
    re.lastIndex = i;
  }
  return tables;
}

/**
 * Effectif d'une page de saison : lignes { article, label, location } issues
 * de la table dont l'en-tête contient Club/Team ET Location/Venue/Stadium/City.
 * Repli : les étiquettes de la carte {{Location map~ … label=[[…]]}}.
 */
export function parseRoster(content, expectedCount) {
  const candidates = [];
  for (const table of findTables(content)) {
    const [headerPart, ...rowParts] = table.split(/\n\|-[^\n]*/);
    const header = headerPart.replace(/\|\+[^\n]*/g, '');
    if (!/!\s*[^\n!]*\b(Club|Team)\b/i.test(header)) continue;
    if (!/\b(Location|Venue|Stadium|Ground|City|Home)\b/i.test(header)) continue;
    const rows = [];
    for (const row of rowParts) {
      const cells = ('\n' + row.trim())
        .split(/\n[|!]|\|\||!!/)
        .map((c) => c.trim())
        .filter(Boolean);
      if (!cells.length) continue;
      const link = firstWikilink(cellContent(cells[0]));
      if (!link) continue;
      let location = null;
      if (cells[1]) {
        const c = cellContent(cells[1]);
        const l2 = firstWikilink(c);
        location = l2 ? l2.label : stripMarkup(c) || null;
      }
      rows.push({ article: link.article, label: link.label, location });
    }
    if (rows.length >= 8) candidates.push(rows);
  }
  const exact = candidates.find((rows) => rows.length === expectedCount);
  if (exact) return { rows: exact, method: 'table' };
  // repli : carte des localisations
  const rows = [];
  const re = /\{\{\s*[Ll]ocation map~[^}]*?\|\s*label\s*=\s*(?:'''|)?\s*\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g;
  let m;
  while ((m = re.exec(content))) {
    const article = m[1].trim();
    if (!rows.some((r) => r.article === article)) rows.push({ article, label: stripMarkup(m[2] ?? article), location: null });
  }
  if (rows.length === expectedCount) return { rows, method: 'location-map' };
  return { rows: candidates[0] ?? rows, method: 'mismatch', candidates: candidates.map((c) => c.length) };
}

/** Champs utiles d'une infobox de club ou de sélection (anglais). */
export function parseClubInfobox(content) {
  const box = extractTemplate(content, /Infobox (?:football club|national football team)/i);
  if (!box) return null;
  const p = parseTemplateParams(box);
  const hex = (k) => (p[k] ?? '').replace(/<!--[\s\S]*?-->/g, '').trim();
  return {
    clubname: stripMarkup(p['clubname'] ?? p['name'] ?? ''),
    fullname: stripMarkup(p['fullname'] ?? ''),
    shortName: stripMarkup(p['short name'] ?? p['shortname'] ?? ''),
    nickname: stripMarkup(p['nickname'] ?? ''),
    ground: stripMarkup(p['ground'] ?? p['stadium'] ?? p['home stadium'] ?? ''),
    fifaTrigramme: stripMarkup(p['fifa trigramme'] ?? p['fifa_trigramme'] ?? ''),
    kit: {
      leftarm1: hex('leftarm1'),
      body1: hex('body1'),
      rightarm1: hex('rightarm1'),
      shorts1: hex('shorts1'),
      socks1: hex('socks1'),
      leftarm2: hex('leftarm2'),
      body2: hex('body2'),
      shorts2: hex('shorts2'),
      socks2: hex('socks2'),
      body3: hex('body3'),
    },
  };
}

/** Champs couleur d'une infobox française ({{Infobox Club de football}} ou équipe nationale). */
export function parseFrenchInfobox(content) {
  const box = extractTemplate(content, /Infobox (?:Club de football|Équipe nationale de football|Équipe de football)/i);
  if (!box) return null;
  const p = parseTemplateParams(box);
  return {
    couleurCadre: (p['couleur cadre'] ?? '').trim(),
    couleurEcriture: (p['couleur écriture'] ?? p['couleur ecriture'] ?? '').trim(),
    couleurs: stripMarkup(p['couleurs'] ?? p['couleur'] ?? ''),
    nomCourt: stripMarkup(p['nom court'] ?? p['surnom'] ?? ''),
  };
}

/** Classement FIFA complet depuis le module Lua de Wikipédia. */
export function parseFifaRankingModule(luaSource) {
  const rankings = [];
  const re = /\{\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*(-?\d+)\s*,\s*([\d.]+)\s*\}/g;
  let m;
  while ((m = re.exec(luaSource))) rankings.push({ name: m[1], rank: Number(m[2]), move: Number(m[3]), points: Number(m[4]) });
  const dateMatch = /data\.updated\s*=\s*\{\s*day\s*=\s*(\d+)\s*,\s*month\s*=\s*'([A-Za-z]+)'\s*,\s*year\s*=\s*(\d+)/.exec(luaSource);
  let updated = null;
  if (dateMatch) {
    const monthIndex = new Date(`${dateMatch[2]} 1, 2000`).getMonth();
    updated = `${dateMatch[3]}-${String(monthIndex + 1).padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  }
  const sourceUrl = /url\s*=\s*"([^"]+)"/.exec(luaSource)?.[1] ?? null;
  return { rankings: rankings.sort((a, b) => a.rank - b.rank), updated, sourceUrl };
}
