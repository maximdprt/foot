# Plan écran par écran et inventaire des composants

Livrable 1 du cahier des charges. Chaque écran ci-dessous existe dans le dépôt ;
la colonne « Fichier » donne son emplacement exact.

---

## 1. Arborescence de navigation

```
app/_layout.tsx                    Stack racine (polices, stores, session, thème)
│
├── (tabs)/                        Tab bar 5 onglets — accessible SANS compte
│   ├── index.tsx          /          Home
│   ├── training.tsx       /training  Entraînement
│   ├── booking.tsx        /booking   Réservation
│   ├── social.tsx         /social    Social
│   └── profile.tsx        /profile   Profil (engrenage → Paramètres)
│
├── (auth)/                        Présenté en modal
│   ├── sign-in.tsx        /sign-in          Créer un compte / Se connecter
│   └── forgot-password.tsx /forgot-password Mot de passe oublié
│
├── (onboarding)/                  12 écrans, gestes de retour désactivés
│   ├── welcome.tsx        /welcome         0  Bienvenue
│   ├── identity.tsx       /identity        1  Prénom + photo
│   ├── plays.tsx          /plays           2  Tu joues déjà au foot ?
│   ├── level.tsx          /level           3  Ton niveau ?
│   ├── club.tsx           /club            4  Ton club actuel ? (facultatif)
│   ├── position.tsx       /position        5  Ton poste préféré ?
│   ├── location.tsx       /location        6  Où es-tu ?
│   ├── play-locations.tsx /play-locations  7  Où joues-tu ? (multiple)
│   ├── frequency.tsx      /frequency       8  À quelle fréquence ?
│   ├── goals.tsx          /goals           9  Tes objectifs ? (1 à 3)
│   ├── team.tsx           /team           10  Ton équipe de cœur ★
│   └── summary.tsx        /summary        11  Récapitulatif
│
└── settings/
    ├── index.tsx          /settings              Liste en sections
    ├── account.tsx        /settings/account      Compte
    ├── profile.tsx        /settings/profile      Mon profil
    ├── appearance.tsx     /settings/appearance   Apparence
    ├── notifications.tsx  /settings/notifications
    ├── privacy.tsx        /settings/privacy      Confidentialité (RGPD)
    ├── language.tsx       /settings/language     Langue
    ├── help.tsx           /settings/help         Aide & support
    ├── about.tsx          /settings/about        À propos (5 taps → debug)
    ├── debug.tsx          /settings/debug        Debug thème (caché)
    └── legal/[doc].tsx    /settings/legal/terms|privacy|licenses
```

---

## 2. Wireframes textuels

### 2.1 Splash et arrivée

```
┌──────────────────────────┐
│                          │   Fond blanc, logo centré.
│           ◎              │   Maintenu tant que : polices Inter chargées
│        Pelouse           │   + stores réhydratés + session restaurée.
│                          │   Puis redirection : app, ou reprise
└──────────────────────────┘   de l'onboarding à l'étape sauvegardée.
```

Aucun mur de connexion : un visiteur arrive directement sur `/` (Home).

### 2.2 Home — visiteur

```
┌──────────────────────────┐
│ Salut 👋            (h1) │  ScreenHeader
│ ┌──────────────────────┐ │
│ │ Crée ton profil pour │ │  Card tone="soft" (primarySoft, 10 %)
│ │ personnaliser ton app│ │
│ │ Ton équipe, tes …    │ │
│ │ [ Créer un compte  ] │ │  Button primary (pill 52 px)
│ │  Se connecter   Régl.│ │  Button variant="text" ×2
│ └──────────────────────┘ │
│                          │
│          ( ◎ )           │  EmptyState : cercle primarySoft 96 px
│      Ton fil d'actu      │  + icône ligne 40 px + titre + « Bientôt disponible »
│    Bientôt disponible    │
│                          │
│ Raccourcis          (h3) │
│ ┌────────┐ ┌────────┐    │  TileGrid : 2 colonnes, tuiles 8 px,
│ │▉ Matchs│ │▉ Séance│    │  bloc de couleur primaire 64×64 à gauche
│ └────────┘ └────────┘    │
│ ┌────────┐ ┌────────┐    │
│ │▉ Amis  │ │▉ Terr. │    │
│ └────────┘ └────────┘    │
├──────────────────────────┤
│  ⌂    ⚲    ▤    ⚇    ⊙  │  Tab bar : fond blanc, ligne #E5E7EB,
│ Home Entr. Rés. Soc. Prof│  actif = primaire + label gras
└──────────────────────────┘
```

Connecté : le titre devient « Salut Kylian 👋 » et la carte visiteur disparaît.

### 2.3 Bottom sheet « Connecte-toi pour continuer »

```
        ┌──────────────────┐
        │       ▁▁▁        │   Poignée grise centrée
        │ Connecte-toi     │   Titre h2
        │ pour continuer   │
        │ Crée un compte…  │   Sous-titre gris
        │ [ Créer un compte]│  pill primaire
        │ [ Se connecter   ]│  pill secondaire (bordure noire)
        │   Annuler         │  bouton texte
        └──────────────────┘   Coins supérieurs 20 px
```

Montée une fois à la racine (`AuthGateSheet`), déclenchée par
`useUIStore.getState().showAuthGate()` depuis n'importe quelle action verrouillée.

### 2.4 Création de compte / connexion

```
┌──────────────────────────┐
│                       ✕  │
│ ┌────────────┬─────────┐ │  SegmentedControl : pill grise,
│ │Créer compte│Se conn. │ │  segment actif blanc + ombre légère
│ └────────────┴─────────┘ │
│ [  Continuer avec Apple ]│  pill secondaire + glyphe
│ [  Continuer avec Google]│  pill secondaire + glyphe
│ ───────── ou ─────────── │
│ Email                    │  Input : fond #F7F7F8, coins 8 px,
│ [ toi@exemple.fr       ] │  bordure primaire au focus
│ Mot de passe             │
│ [ ••••••••          👁 ] │  masquable
│ ⚠ 8 caractères minimum   │  erreur sous le champ, en rouge
│ [   Créer mon compte    ]│  désactivé tant que le form est invalide
│     Mot de passe oublié ?│  (mode connexion uniquement)
│ En continuant, tu accep… │
└──────────────────────────┘
```

Après **création** → onboarding obligatoire à l'étape 0.
Après **connexion** → app si l'onboarding est terminé, sinon reprise à
`user_profiles.onboarding_step`.

### 2.5 Gabarit d'une question d'onboarding

```
┌──────────────────────────┐
│ ▬▬▬▬▬▬▬▬░░░░░░░░░░░░░░░ │  ProgressBar 3 px, couleur primaire
│ ‹   Étape 3 sur 11       │  chevron retour + compteur
│                          │
│ Ton niveau ?        (28) │  h1 gras, tracking −0,5
│                          │
│ ┌──────────────────────┐ │  SelectableCard : coins 12 px,
│ │ Débutant           ○ │ │  fond #F7F7F8, bordure 2 px transparente
│ ├──────────────────────┤ │
│ │ Loisir             ● │ │  sélectionnée : fond primarySoft,
│ ├──────────────────────┤ │  bordure primaire, titre en primaire, ✓
│ │ Confirmé           ○ │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ [      Continuer       ] │  pill pleine largeur, désactivé sans réponse
│          Passer          │  bouton texte, écrans facultatifs seulement
└──────────────────────────┘
```

Variantes :

| Écran | Particularité |
|---|---|
| 0 Bienvenue | Écran d'information plein écran, cercle teinté + `Sparkles`, pas de barre de progression |
| 1 Identité | `Input` pseudo (2–24 car.) + `Avatar` 96 px + boutons Caméra / Galerie (permissions demandées au tap) |
| 4 Club | Recherche + `Chip` de suggestions (clubs FR de `teams.json`), saisie libre acceptée, bouton « Je n'ai pas de club » |
| 6 Localisation | `Chip` pour les 18 régions, puis recherche de ville ; bouton « Utiliser ma position » — **la permission GPS est demandée ici et nulle part avant** |
| 7 / 9 Multiples | `MultiChoice` ; les objectifs se bloquent à 3 (les cartes non choisies se désactivent) |
| 10 Équipe ★ | Ouvre le `TeamPicker` plein écran ; la sélection **change les couleurs de l'app en direct** |
| 11 Récapitulatif | Carte résumé, chaque ligne modifiable au tap (`?edit=1`), bouton « Valider mon profil » puis animation 400 ms |

### 2.6 Sélecteur d'équipe (`TeamPicker`)

```
        ┌──────────────────┐
        │       ▁▁▁        │
        │ Ton équipe de cœur│
        │ [🔍 Club, ville…]│  Recherche : nom, abréviation, ville
        │                  │
        │ ◕ Aucune équipe  │  Toujours en tête de liste (thème Neutre)
        │   Thème Neutre   │
        │ LIGUE 1          │  En-tête collant par championnat
        │ ◕ Paris SG    ✓  │  Pastille bicolore + nom + abr. · ville
        │ ◕ Marseille      │  Tap = sélection + PREVIEW LIVE du thème
        │ ◕ Lyon           │
        │ LIGUE 2          │
        │ …                │
        │ [   Confirmer   ]│  pill primaire
        └──────────────────┘  ~92 % de la hauteur d'écran
```

### 2.7 Profil et Paramètres

```
┌──────────────────────────┐      ┌──────────────────────────┐
│ Profil               ⚙   │      │ ‹ Paramètres             │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │      │ COMPTE                   │
│ ▓ dégradé ≤ 120 px    ▓ │      │ ⛨ Compte              ›  │
│ (◉) ← Avatar anneau prim.│      │ MON PROFIL               │
│ Kylian              (h2) │      │ ⚇ Mon profil          ›  │
│ ◕ Paris Saint-Germain    │      │ APPARENCE                │
│                          │      │ ◐ Apparence           ›  │
│         ( ◎ )            │      │ NOTIFICATIONS         ›  │
│      Ton activité        │      │ CONFIDENTIALITÉ       ›  │
│    Bientôt disponible    │      │ LANGUE                ›  │
│ ┌────────┐ ┌────────┐    │      │ AIDE & SUPPORT        ›  │
│ │▉ Stats │ │▉ Badges│    │      │ À PROPOS              ›  │
│ └────────┘ └────────┘    │      │      Se déconnecter      │
└──────────────────────────┘      └──────────────────────────┘
```

Visiteur : Paramètres n'affiche que Apparence, Langue, Aide, À propos, plus une
carte d'invitation à créer un compte.

Suppression de compte : **deux bottom sheets rouges** successives (`tone="danger"`)
avant l'appel à l'Edge Function `delete-account`.

---

## 3. Inventaire des composants

### 3.1 Design system — `src/components/ui/`

| Composant | Rôle | Grammaire |
|---|---|---|
| `Text` | Texte typé : variante + token de couleur | Inter, H1 30/800, H2 22/700, H3 18/700, Body 16/400, Caption 13/500, Label 11/600 |
| `Screen` / `ScreenHeader` | Conteneur d'écran + en-tête | Fond blanc, safe area, padding 16 px, titre 28 px |
| `Button` | Bouton pill | 52 px, radius 999 ; `primary` / `secondary` / `text` / `danger` |
| `IconButton` | Bouton icône | Zone tactile 44 px |
| `Card` | Carte sans bordure | 12 px (sm) / 16 px (lg) ; `surface`, `elevated`, `soft` |
| `Tile` / `TileGrid` | Raccourci « Spotify » | 8 px, bloc de couleur à gauche, grille 2 colonnes |
| `Chip` | Filtre / suggestion | Pill 36 px ; sélectionnée = primaire + `onPrimary` |
| `SelectableCard` | Réponse du questionnaire | 12 px, bordure 2 px primaire + ✓ quand choisie |
| `Input` | Champ de saisie | Fond `#F7F7F8`, 8 px, bordure primaire au focus, mot de passe masquable |
| `Toggle` | Interrupteur | Piste primaire quand activé |
| `ListItem` / `ListSection` | Liste type iOS | Séparateurs fins `#E5E7EB`, chevron, valeur à droite |
| `Divider` | Séparateur | 1 px `#E5E7EB` |
| `Sheet` | Bottom sheet | Coins supérieurs 20 px, poignée grise, `fullScreen`, `tone="danger"` |
| `ProgressBar` | Progression | 3 px, couleur primaire, animée 300 ms |
| `SegmentedControl` | Segment | Pill grise, segment actif blanc |
| `Avatar` | Avatar circulaire | Repli sur les initiales, anneau primaire optionnel |
| `TeamDot` | Pastille bicolore | Cercle divisé primaire / secondaire (remplace les écussons) |
| `EmptyState` | État vide | Cercle `primarySoft` 96 px + icône ligne + « Bientôt disponible » |
| `Gradient` | Dégradé | Primaire → secondaire (SVG), bandeau de profil et animation |
| `ToastHost` | Retours d'action | Pill flottante au-dessus de la tab bar |
| `BrandGlyph` | Glyphes Apple / Google | Seule exception documentée à « aucune couleur en dur » |

### 3.2 Composants transverses — `src/components/`

| Composant | Rôle |
|---|---|
| `TeamPicker` | Sélecteur d'équipe plein écran, preview live (onboarding + Paramètres) |
| `AuthGateSheet` | « Connecte-toi pour continuer », monté une fois à la racine |
| `ThemeApplyOverlay` | Animation 400 ms « le thème s'applique » à la validation du profil |

### 3.3 Composants de l'onboarding — `src/features/onboarding/`

| Composant | Rôle |
|---|---|
| `QuestionScreen` | Gabarit commun : progression, retour, titre, bouton Continuer / Passer |
| `SingleChoice` | Liste de `SelectableCard` à choix unique |
| `MultiChoice` | Choix multiple avec plafond (3 objectifs) |
| `useOnboarding` | Contrôleur : brouillon, validation, navigation, sauvegarde par étape |

---

## 4. Ce qui est explicitement hors périmètre

- Toute logique métier des 5 onglets (matchs, séances, réservations, messagerie).
- Mode sombre dans l'UI — l'architecture des tokens le prévoit
  (`darkPalette`, `buildTheme(team, { mode: 'dark' })`), la ligne est grisée « Bientôt ».
- Intégration des écussons officiels (marques déposées) : `logoUrl` reste `null`.
