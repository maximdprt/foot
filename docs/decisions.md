# Décisions prises par défaut

Le cahier des charges demande de retenir « l'option la plus standard du marché »
quand une information manque, et de le signaler. Voici la liste complète.

---

## Produit et nommage

| Sujet | Décision | Pourquoi |
|---|---|---|
| Nom de l'app | **Pelouse** (`src/config/app.ts` → `APP_NAME`, `app.json`) | `[NOM_DE_L'APP]` n'était pas renseigné. Une seule constante à changer pour renommer partout. |
| Identifiants natifs | `app.pelouse.mobile`, scheme `pelouse` | Suivent le nom ; à ajuster avant publication sur les stores. |
| Ordre des onglets | Home · Entraînement · Réservation · Social · Profil | Ordre donné dans le cahier des charges, Profil à droite (convention mobile). |
| Version affichée | `0.1.0`, lue depuis `app.json` via `expo-constants` | Une seule source de vérité. |

## Stack

| Sujet | Décision | Pourquoi |
|---|---|---|
| Persistance locale | **AsyncStorage** plutôt que MMKV | MMKV impose un module natif : incompatible avec Expo Go et le web, donc avec un `npm run dev` immédiat. L'adaptateur est isolé dans `src/lib/storage.ts` : basculer sur MMKV ne touche que ce fichier. |
| Styles | `StyleSheet` natif, pas NativeWind | Les tokens du thème sont dynamiques (couleur du club) ; un objet de style calculé depuis `useTheme()` évite la génération de classes à la volée. |
| Backend sans configuration | **Backend de démonstration local** quand les variables Supabase manquent | Le cahier des charges demande du code « directement exécutable ». Le contrat `Backend` est identique dans les deux modes, les écrans ne changent pas. |
| Navigation | Groupes Expo Router `(auth)`, `(onboarding)`, `(tabs)` | Structure imposée par le cahier des charges. Les groupes n'apparaissent pas dans l'URL : l'onboarding est servi sur `/welcome`, `/identity`, etc. |
| Dégradés | `react-native-svg` plutôt que `expo-linear-gradient` | Évite une dépendance de plus : `react-native-svg` est déjà requis par `lucide-react-native`. |

## Onboarding

| Sujet | Décision | Pourquoi |
|---|---|---|
| Base de clubs FFF | **Non disponible publiquement** → suggestions issues des clubs français de `teams.json` + saisie libre toujours acceptée | La FFF ne publie pas d'API ouverte sur ses ~14 000 clubs. La saisie libre couvre tous les cas, et la structure permet de brancher une vraie base plus tard. |
| Régions et villes | Liste statique embarquée : 13 régions métropolitaines + 5 DROM, ~15 villes par région (`src/features/onboarding/regions.ts`) | Autocomplétion instantanée et hors ligne. Une ville absente peut être saisie librement. |
| Géolocalisation | Permission demandée **uniquement** au tap sur « Utiliser ma position » (écran 6) | Exigence explicite du cahier des charges. Le géocodage inverse renseigne ville + région ; en cas d'échec, message clair et saisie manuelle. |
| Photo de profil | Permissions caméra / galerie demandées au tap, jamais au démarrage | Même principe que la géolocalisation. |
| Sauvegarde de la progression | `user_profiles.onboarding_step` écrit à **chaque** étape, brouillon local en parallèle | Permet de reprendre exactement où l'utilisateur s'était arrêté, même après une désinstallation du seul cache local. |
| Reprise après connexion | Si l'onboarding est terminé → app ; sinon → étape sauvegardée | Comportement demandé. `firstIncompleteStep()` sert de garde-fou si l'index stocké est incohérent. |
| Données du visiteur | Brouillon + équipe supportée migrés vers le compte à l'inscription ; un profil déjà complet n'est jamais écrasé | Évite de perdre des réponses, et évite qu'une reconnexion n'efface un profil existant. |

## Direction artistique

| Sujet | Décision | Pourquoi |
|---|---|---|
| Échelle typographique | H1 30 px (fourchette 28–32 demandée), en-têtes d'onglet forcés à 28 px | 30 px tient sur deux lignes pour les questions longues ; les en-têtes restent à la valeur demandée. |
| Police de repli | Si Inter ne se charge pas, police système + `fontWeight` équivalent | L'app ne doit jamais rester bloquée sur le splash. |
| Mode sombre | Tokens et `darkPalette` en place, `buildTheme(team, { mode: 'dark' })` fonctionnel, **ligne grisée « Bientôt » dans l'UI** | Hors périmètre, mais l'architecture devait le permettre. Les tests vérifient que les deux modes exposent les mêmes tokens. |
| Glyphes Apple / Google | Couleurs de marque écrites en dur dans `BrandGlyph.tsx` | Seule exception à « aucune couleur en dur », imposée par les chartes Apple et Google. Documentée dans le fichier. |
| Toasts | Retours d'action en pill flottante au-dessus de la tab bar | Aucun composant n'était spécifié pour les confirmations (« Profil enregistré », « Thème appliqué »). |

## Thème et données d'équipes

| Sujet | Décision | Pourquoi |
|---|---|---|
| Saison | **2026-27** (`--season` pour changer) | Saison en cours. Les pages Wikipédia « 2026–27 <championnat> » servent d'effectif de référence. |
| Priorité des sources | charte officielle > TheSportsDB > maillot Wikipédia (en) > infobox Wikipédia (fr) | La charte officielle est la seule source normative ; les autres servent de contrôle croisé. Chaque primaire retenue est comparée aux autres (ΔE CIE76 ≤ 30). |
| Clubs en blanc | `themeOverride` vers une couleur foncée de l'identité du club, assombrie si besoin | Le blanc est déjà le fond de l'app. Chaque override est documenté dans `docs/teams-report.md`. |
| Couleurs claires (jaune, bleu ciel) | Assombrissement automatique par pas de 1 % de luminosité HSL jusqu'à 4,5:1 sur blanc, teinte et saturation conservées | Garantit WCAG AA sans dénaturer l'identité. La couleur d'origine reste dans `colors.primary`. |
| Écussons | **Non intégrés** — pastille bicolore + abréviation, `logoUrl: null` | Marques déposées. Le champ est prêt si les droits sont obtenus. |
| Sélections nationales | Top 30 FIFA + France, classement lu depuis le module Lua de Wikipédia | Le classement FIFA change à chaque fenêtre internationale : le script le relit à chaque exécution. |
| Secondaire trop proche de la primaire | Remplacée par la tertiaire, sinon par la couleur de texte | Évite les dégradés et les badges illisibles (deux couleurs quasi identiques). |

## Marque et animation

| Sujet | Décision | Pourquoi |
|---|---|---|
| Bibliothèque d'animation | **`Animated` de React Native**, pas Reanimated (pourtant installé) | Le reste du code l'utilisait déjà, elle se comporte à l'identique sur iOS, Android et le web, et le pilote natif couvre opacité + transformations, c'est-à-dire tout ce dont ces animations ont besoin. Une seule API évite deux systèmes de ressorts qui ne s'accordent pas. |
| Logo | **Tracé vectoriel** généré depuis le PNG (marching squares + Douglas–Peucker), 8 Ko | Permet de dessiner le logo trait par trait, de le remplir du dégradé du club et de le rendre net à toute taille. Un PNG n'aurait donné ni l'animation ni le filigrane en contour. |
| Icône de l'app | Silhouette blanche sur noir | C'est le logo fourni. L'app est blanche à l'intérieur, mais une icône blanche sur blanc serait invisible sur l'écran d'accueil. |
| Ballon 3D | Géométrie réelle (12 faces sur les sommets d'un icosaèdre, projetées image par image) plutôt qu'un motif qui défile | Un motif plat sur un disque ne donne ni la courbure ni le raccourcissement des faces sur les bords : l'œil voit immédiatement que ce n'est pas une sphère. Le coût est faible (une douzaine de polygones). |
| Écran de démarrage | Animé, avec une durée **minimale** de 1,1 s | Le cahier des charges demande un splash très court. L'écran ne retarde jamais l'app au-delà de ce seuil : dès que polices, stores et session sont prêts, il s'efface. |
| Animations réduites | Toutes les boucles décoratives s'arrêtent, les entrées deviennent instantanées | Exigence d'accessibilité. Vérifié par les tests : tous les composants animés se rendent encore dans ce mode. |
| Intensité du décor | Pelouse et tracés entre 2,5 % et 3,5 % d'opacité | La règle « ~75 % de blanc » reste prioritaire sur le décor : la trame doit se deviner, pas se regarder. |

## Compte et conformité

| Sujet | Décision | Pourquoi |
|---|---|---|
| Suppression de compte | Edge Function `delete-account` (clé `service_role` côté serveur) | La clé `service_role` ne doit jamais être embarquée dans une app cliente. |
| Export RGPD | JSON via la feuille de partage système (natif) ou affiché et sélectionnable (web) | Aucun format n'était imposé ; le JSON est lisible et ré-importable. |
| Comptes liés | Affichés en lecture seule (Lié / Non lié) | Le cahier des charges demande de les montrer, pas de gérer le rattachement. |
| CGU / politique de confidentialité | Écrans en place, contenu marqué « à compléter avant la mise en production » | Ce sont des documents juridiques, pas des décisions techniques. |
| Licences open source | Liste des dépendances embarquées et de leur licence | Aucune n'impose d'obligation copyleft. |
