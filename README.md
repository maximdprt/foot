# Pelouse — fondation d'une app mobile de football amateur

Application **React Native + Expo (TypeScript strict)** pour joueurs de foot amateurs.
Ce dépôt contient la **fondation** : parcours d'entrée (visiteur, compte, onboarding),
navigation à 5 onglets, page Paramètres complète et système de thème dynamique
piloté par l'équipe que supporte l'utilisateur.

> Les fonctionnalités métier des onglets ne sont **pas** implémentées : les écrans
> montrent la direction artistique avec les composants du design system.

---

## Démarrage rapide

```bash
npm install
npm run dev          # Expo sur le web (http://localhost:8081)
npm run dev:native   # Expo Go / simulateur iOS / émulateur Android
```

**L'app démarre sans aucune configuration.** Sans variables Supabase, elle bascule
sur un **backend de démonstration local** (AsyncStorage) : création de compte,
connexion, onboarding et paramètres fonctionnent, mais rien ne quitte l'appareil.
Un bandeau « mode démo » l'indique dans les Paramètres.

Autres scripts :

```bash
npm run ios / npm run android / npm run web   # cibler une plateforme
npm run typecheck                             # tsc --noEmit
npm run lint                                  # ESLint (config Expo)
npm test                                      # Jest — 65 tests, 6 suites
npm run teams:build                           # régénère src/theme/teams.json
npm run logo:build                            # régénère les icônes + le tracé du logo
npm run screenshots                           # régénère docs/screenshots/ (Chrome requis)
```

Ce que couvrent les tests (`src/__tests__/`) :

| Suite | Vérifie |
|---|---|
| `buildTheme` | contraste AA, `onPrimary`, overrides, tokens, mode sombre, repli de police |
| `onboarding` | ordre des étapes, validation de chaque question, reprise à l'étape sauvegardée |
| `teams` | les 181 entrées de `teams.json` : effectifs, unicité, AA pour **chaque** équipe |
| `i18n` | parité `fr.json` / `en.json`, interpolations, et toute clé utilisée dans le code |
| `designSystem` | rendu réel des composants avec 3 thèmes, couleurs issues du thème |
| `screens` | rendu réel des 5 onglets, de l'auth, d'une question et des Paramètres (visiteur et connecté), bascule de langue |
| `motion` | intégrité du tracé du logo, rendu de tous les composants animés, mode « animations réduites » |

---

## Variables d'environnement

Copie `.env.example` en `.env` :

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL du projet Supabase (`https://xxx.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé publique `anon` du projet |

Les deux sont lues au démarrage (`src/lib/supabase.ts`). Si l'une manque, le mode
démo local prend le relais : aucune erreur, aucun écran bloqué.

### Mise en place de Supabase

1. Exécuter `supabase/schema.sql` (éditeur SQL du projet, ou `supabase db push`).
   Il crée les types énumérés, `user_profiles`, `user_settings`, `teams`, les
   déclencheurs, **les policies RLS** et le bucket Storage `avatars`.
2. Activer les fournisseurs **Email**, **Google** et **Apple** dans
   *Authentication > Providers*, avec l'URL de retour `pelouse://auth-callback`
   (et l'origine du site pour le web).
3. Déployer la fonction de suppression de compte (RGPD) :
   `supabase functions deploy delete-account` — elle seule détient la clé
   `service_role`, qui ne doit jamais être embarquée dans l'app.

---

## Architecture

```
app/                      Expo Router (navigation par fichiers)
  _layout.tsx             polices, stores, session, ThemeProvider, toasts, sheets
  (tabs)/                 Home · Entraînement · Réservation · Social · Profil
  (auth)/                 sign-in (segment création / connexion), mot de passe oublié
  (onboarding)/           welcome → identity → … → team → summary (12 écrans)
  settings/               index, compte, profil, apparence, notifications,
                          confidentialité, langue, aide, à propos, debug, legal/[doc]

src/components/ui/        Design system : Button, Card, Tile, Chip, Sheet, ProgressBar,
                          ListItem, Toggle, Input, Avatar, TeamDot, TeamCrest, EmptyState…
src/components/brand/     Logo vectoriel animable, écran de démarrage
src/components/motion/    Football3D, PitchBackground, TiltCard, ConfettiBurst, Shimmer
src/components/navigation/ Icône d'onglet animée
src/components/           TeamPicker, AuthGateSheet, ThemeApplyOverlay
src/theme/                tokens.ts, buildTheme.ts, ThemeProvider.tsx, teams.json
src/features/             auth/, onboarding/, profile/, settings/
src/store/                Zustand : session, profil, thème, réglages, UI
src/lib/                  client Supabase, backend (Supabase ou démo), storage, contraste, motion
src/i18n/                 fr.json (défaut), en.json
assets/brand/             logo source (une seule image, tout en dérive)
scripts/                  scrape-teams.mjs, build-logo.mjs, screenshots.mjs + données curées
supabase/                 schema.sql + Edge Function delete-account
```

Règles tenues par le code :

- **aucune couleur ni texte en dur dans les écrans** — tout passe par `useTheme()` et `t()` ;
- les onglets vides n'utilisent que des composants de `src/components/ui/` ;
- zones tactiles ≥ 44 px, labels d'accessibilité, contraste AA, Dynamic Type
  (`maxFontSizeMultiplier` sur les titres).

---

## Le blanc est la base

Fond `#FFFFFF` partout, surfaces secondaires `#F7F7F8`, texte `#121212` / `#6B7280`.
Les couleurs du club sont des **accents** : boutons primaires, onglet actif, barre de
progression, réponses sélectionnées, chips, anneau d'avatar, bandeau de profil
(≤ 120 px). Répartition visée : ~75 % blanc, ~20 % primaire, ~5 % secondaire.

`buildTheme(team)` est une **fonction pure** qui :

1. applique `themeOverride` s'il existe (clubs en blanc ou trop clairs) ;
2. assombrit automatiquement la primaire jusqu'à **4,5:1 sur blanc** (WCAG AA) ;
3. calcule `onPrimary` / `onSecondary` (blanc si luminance < 0,5, sinon `#121212`) ;
4. dérive `primarySoft` (primaire à 10 %) et le dégradé primaire → secondaire.

Le changement de thème est **instantané** (aucun rechargement), persisté localement
(AsyncStorage) et, si l'utilisateur a un compte, dans `user_profiles.favorite_team_id`.

**Écran de debug** : Paramètres > À propos > 5 taps sur la version. Il affiche tous
les tokens du thème courant, ses métadonnées et une galerie qui fait défiler tous
les thèmes d'équipes pour contrôle visuel.

---

## Ajouter ou corriger une équipe

`src/theme/teams.json` est **généré**, jamais édité à la main. Pour corriger une
couleur ou ajouter une entrée, modifier les données curées puis régénérer :

| Fichier | Rôle |
|---|---|
| `scripts/data/official-colors.json` | charte officielle du club (source prioritaire) |
| `scripts/data/overrides.json` | `themeOverride` documenté (club en blanc, couleur trop claire) |
| `scripts/data/aliases.json` | nom TheSportsDB, abréviation, ville, nom français, sélections |

```bash
npm run teams:build                              # saison courante, cache activé
node scripts/scrape-teams.mjs --season 2027-28   # nouvelle saison
node scripts/scrape-teams.mjs --no-cache         # tout refaire
```

Le script croise **au moins deux sources** par couleur (charte officielle,
TheSportsDB, infobox Wikipédia anglaise et française), valide le contraste, puis
écrit :

- `src/theme/teams.json` — consommé par l'app ;
- `docs/teams-report.md` — rapport : overrides, assombrissements, sources en désaccord ;
- `scripts/out/teams-provenance.json` — valeurs brutes de chaque source.

**Les écussons officiels ne sont pas intégrés** (marques déposées) : l'app affiche
une pastille bicolore + abréviation (`TeamDot`). Le champ `logoUrl` reste `null`
en attendant d'éventuels droits.

---

## Changer le logo

`assets/brand/logo-source.png` est la source unique : une silhouette claire sur
fond sombre, au format carré. Remplace-la puis lance :

```bash
npm run logo:build
```

Le script régénère les icônes iOS / Android / web **et** le tracé vectoriel
(`src/components/brand/logoPath.ts`) qui permet d'animer le logo et de le
teinter aux couleurs du club. Détails dans [`docs/motion.md`](docs/motion.md).

---

## Ajouter un onglet

1. Créer `app/(tabs)/<nom>.tsx` sur le modèle de `training.tsx`
   (`Screen` + `ScreenHeader` + `EmptyState` + `TileGrid`).
2. Déclarer l'onglet dans `app/(tabs)/_layout.tsx` :

```tsx
<Tabs.Screen
  name="<nom>"
  options={{
    title: t('tabs.<nom>'),
    tabBarIcon: ({ color }) => <Icone size={iconSize} color={color} strokeWidth={2} />,
  }}
/>
```

3. Ajouter les clés `tabs.<nom>` et `<nom>.*` dans `src/i18n/fr.json` **et** `en.json`.

Aucune couleur à écrire : la tab bar prend `theme.colors.primary` pour l'onglet actif.

---

## Ajouter une question à l'onboarding

1. Ajouter le champ au modèle (`src/features/profile/types.ts`), à la table
   (`supabase/schema.sql`) et au mapping (`src/features/profile/mapping.ts`).
2. Déclarer l'étape dans `src/features/onboarding/steps.ts` (ordre, caractère
   facultatif, règle de validation dans `isStepValid`).
3. Créer `app/(onboarding)/<clé>.tsx` avec `QuestionScreen` + `SingleChoice` /
   `MultiChoice`.
4. Ajouter la ligne correspondante dans `src/features/profile/summary.ts` pour
   qu'elle apparaisse au récapitulatif **et** dans Paramètres > Mon profil.
5. Ajouter les libellés dans `fr.json` et `en.json`.

Les tests de `src/__tests__/onboarding.test.ts` verrouillent l'ordre des étapes :
ils échoueront tant que la liste n'aura pas été mise à jour.

---

## Documentation

- [`docs/screens.md`](docs/screens.md) — plan écran par écran et inventaire des composants
- [`docs/motion.md`](docs/motion.md) — marque, système d'animation, composants 3D
- [`docs/rendu.md`](docs/rendu.md) — captures des 5 onglets avec trois thèmes (`npm run screenshots`)
- [`docs/teams-report.md`](docs/teams-report.md) — rapport de génération de `teams.json`
- [`docs/decisions.md`](docs/decisions.md) — choix par défaut pris en l'absence de consigne
