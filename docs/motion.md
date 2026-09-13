# Marque et animation

Ce document décrit l'identité visuelle en mouvement : le logo, les briques
d'animation, les composants 3D, et où chacun est utilisé.

---

## 1. Le logo

`assets/brand/logo-source.png` — silhouette blanche sur fond noir — est la
**source unique**. `npm run logo:build` en dérive tout le reste :

| Sortie | Usage |
|---|---|
| `assets/images/icon.png` | icône iOS / web : silhouette blanche sur noir, comme le logo d'origine |
| `assets/images/splash-icon.png` | splash : silhouette sombre, fond transparent (le splash est blanc) |
| `assets/images/favicon.png` | favicon web |
| `assets/images/android-icon-{foreground,background,monochrome}.png` | icône adaptative Android, 33 % de marge pour la zone de sécurité |
| `src/components/brand/logoPath.ts` | **tracé vectoriel** du logo |

### Pourquoi un tracé vectoriel

Le script binarise la silhouette, en extrait les contours par **marching
squares**, les simplifie (Douglas–Peucker) et les assemble en un chemin SVG
unique en règle `evenodd` : 13 contours, 714 points, **8 Ko**.

Ce que ça permet, qu'un PNG ne permet pas :

- le logo se **dessine trait par trait** (`strokeDashoffset` animé) puis se remplit ;
- il prend le **dégradé du club** (`variant="gradient"`) ;
- il reste net à toute taille, et sert de **filigrane** en contour ;
- une seule ressource pour tous les écrans, au lieu de plusieurs PNG.

```tsx
<Logo size={132} variant="gradient" animated />   // écran de démarrage
<Logo size={180} variant="outline" opacity={0.06} /> // filigrane
<Logo size={132} color="onPrimary" />             // sur l'onde de validation
```

Pour changer de logo : remplacer `assets/brand/logo-source.png` (silhouette
claire sur fond sombre, format carré) et relancer `npm run logo:build`.

---

## 2. Briques d'animation — `src/lib/motion.ts`

Tout passe par l'API **`Animated` de React Native**, pas par Reanimated :
elle se comporte à l'identique sur iOS, Android et le web, et le pilote natif
couvre ce dont on a besoin (opacité et transformations).

| Hook | Rôle |
|---|---|
| `useReducedMotion()` | l'utilisateur a demandé à réduire les animations |
| `useLoop(duration)` | horloge 0 → 1 rejouée en boucle (rotation, balayage) |
| `usePulse(duration)` | va-et-vient 0 → 1 → 0 (respiration, halo, flottement) |
| `useEntrance({ delay, from, scaleFrom })` | entrée fondu + glissement, à poser sur un `Animated.View` |
| `staggerDelay(index)` | retard d'un élément de liste, plafonné pour ne pas faire attendre |
| `useSpringTo(target)` | suit une cible avec un ressort (sélectionné / actif) |
| `usePressScale()` | enfoncement au doigt, retour élastique |

Réglages partagés : `easings` (standard, out, in, overshoot) et `springs`
(gentle, bouncy, snappy).

### Accessibilité

**Toute animation décorative s'arrête** si « Réduire les animations » est actif :
les boucles ne démarrent pas, les entrées sont instantanées, le ballon se fige
sur une orientation lisible, les confettis ne se déclenchent pas. Aucun contenu
n'est jamais masqué par une animation — les tests le vérifient
(`src/__tests__/motion.test.tsx`).

---

## 3. Composants 3D et football — `src/components/motion/`

### `Football3D` — le ballon

Vraie géométrie, pas un motif qui défile. Les 12 faces noires d'un ballon
classique occupent les sommets d'un **icosaèdre** : on les fait tourner dans
l'espace, on projette leurs sommets et on masque celles passées derrière.
La courbure et le raccourcissement des faces sur les bords sont donc réels.

L'ombrage (lumière en haut à gauche, occlusion sur le pourtour, reflet diffus)
fait le volume ; l'opacité de chaque face suit sa profondeur.

```tsx
<Football3D size={72} spinDuration={4200} bounce bounceHeight={22} shadow themed />
```

`bounce` ajoute le rebond avec **écrasement à l'impact et étirement en l'air**,
et `shadow` une ombre au sol qui se resserre quand le ballon monte.

### `PitchBackground` — la pelouse

Bandes de tonte + tracés du terrain (ligne médiane, rond central, surfaces),
dans la couleur primaire à 2,5–3,5 % d'opacité : le blanc reste la base. Un
reflet balaye lentement les bandes.

Les tracés utilisent `preserveAspectRatio="xMidYMid slice"` — sans quoi le rond
central deviendrait une ellipse sur un écran de téléphone.

### `TiltCard` — l'inclinaison 3D

La carte suit le doigt avec une vraie perspective (`perspective` + `rotateX` /
`rotateY`), se soulève légèrement, et un reflet se déplace avec l'inclinaison.
Retour à plat par ressort au relâchement.

### `ConfettiBurst` — la célébration

Confettis et petits ballons, trajectoire en cloche (montée rapide, chute avec
gravité), rotation propre à chaque particule. Les couleurs viennent du thème :
**la célébration prend celles du club**. La gerbe est déterministe (graine
fixe), donc identique à chaque rendu.

### `Shimmer`, `AnimatedNumber`

Reflet de chargement, et compteur qui défile jusqu'à sa valeur.

---

## 4. Où ça anime, écran par écran

| Écran | Animation |
|---|---|
| **Démarrage** | le logo se dessine puis se remplit, le nom apparaît, le ballon rebondit ; l'ensemble s'efface en zoom avant vers l'app |
| **Bienvenue** | terrain en filigrane, logo en dégradé du club, entrée en cascade des six blocs, ballon au-dessus du bouton, halo qui respire sur la CTA |
| **Questionnaire** | ballon qui **roule** en tête de la barre de progression (il tourne proportionnellement à l'avancée), titre puis réponses en cascade, pastille de validation qui arrive par un ressort, icône par réponse |
| **Équipe de cœur** | écusson inclinable en 3D ; au changement de club l'écusson **pivote** et le nouveau apparaît à mi-rotation |
| **Validation du profil** | onde aux couleurs du club depuis le centre, logo inscrit dedans, puis confettis |
| **Home** | logo en filigrane qui dérive lentement, trame de pelouse, sections en cascade |
| **Profil** | bandeau inclinable en 3D (dégradé + tracés du terrain + logo), anneau d'avatar qui pulse |
| **Onglets vides** | cercle de l'état vide qui respire, onde qui s'en échappe, icône qui flotte |
| **Tab bar** | pastille teintée derrière l'icône active, qui arrive par un ressort |
| **Partout** | enfoncement au doigt sur boutons, cartes, tuiles, chips ; retour haptique sur les sélections |

---

## 5. Contrôle

```bash
npm test             # 76 tests, dont le rendu de tous les composants animés
npm run screenshots  # captures réelles, émulation iPhone 390 × 844
```

`npm run screenshots` pilote Chrome par le **protocole DevTools** plutôt que par
`chrome --screenshot`, pour deux raisons : la largeur de fenêtre est plafonnée à
~500 px sous Windows, et `--virtual-time-budget` n'avance plus dès qu'une page
anime en continu — les captures restaient bloquées sur l'écran de démarrage.
