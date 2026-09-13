# Rendu des 5 onglets avec trois thèmes

Livrable 6. Captures réelles de l'application (export web rendu dans Chrome),
régénérables par `npm run screenshots`.

> Format 390 × 844 (iPhone), densité 2 : Chrome est piloté par le protocole
> DevTools, qui accepte n'importe quelle taille d'émulation.

Les captures des onglets sont prises avec un **compte de démonstration** ayant
une ville : sans elle, Matchs, Réservation et Social ne montreraient que leur
état vide. Aucun historique personnel n'est fabriqué — les statistiques et les
badges sont donc à zéro, exactement comme pour un nouveau membre. Les matchs
ouverts, les joueurs alentour et les créneaux, eux, sont générés par l'app à
partir de la ville.

## Ce qu'il faut vérifier

- le fond est **blanc partout** (~75 % de la surface) ;
- la couleur du club n'apparaît qu'en **accents** : bouton primaire, onglet actif,
  bloc des tuiles, cercle de l'état vide, anneau de l'avatar, bandeau du profil ;
- aucun texte en couleur club sur blanc en dessous de 4,5:1 ;
- les trois thèmes changent les accents **sans changer la structure**.

## Neutre (visiteur, aucune équipe)

Vert pelouse `#2E9E5B`, assombri en `#27864D` pour le texte et les icônes.

| Home | Entraînement | Réservation | Social | Profil |
|---|---|---|---|---|
| ![Home](screenshots/neutre-1-home.png) | ![Entraînement](screenshots/neutre-2-entrainement.png) | ![Réservation](screenshots/neutre-3-reservation.png) | ![Social](screenshots/neutre-4-social.png) | ![Profil](screenshots/neutre-5-profil.png) |

## Paris Saint-Germain

Primaire `#004170` (bleu marine), secondaire `#DA291C` (rouge) : aucune correction
nécessaire, le contraste sur blanc est déjà conforme.

| Home | Entraînement | Réservation | Social | Profil |
|---|---|---|---|---|
| ![Home](screenshots/psg-1-home.png) | ![Entraînement](screenshots/psg-2-entrainement.png) | ![Réservation](screenshots/psg-3-reservation.png) | ![Social](screenshots/psg-4-social.png) | ![Profil](screenshots/psg-5-profil.png) |

## Olympique de Marseille

Primaire d'identité `#FFFFFF` : le blanc étant déjà le fond de l'app, un
`themeOverride` documenté bascule sur le bleu ciel du club, assombri en `#197DA5`
pour atteindre 4,65:1 sur blanc.

| Home | Entraînement | Réservation | Social | Profil |
|---|---|---|---|---|
| ![Home](screenshots/om-1-home.png) | ![Entraînement](screenshots/om-2-entrainement.png) | ![Réservation](screenshots/om-3-reservation.png) | ![Social](screenshots/om-4-social.png) | ![Profil](screenshots/om-5-profil.png) |

## Marque et onboarding

| Démarrage | Bienvenue | Création de compte | Question | Équipe de cœur |
|---|---|---|---|---|
| ![Démarrage](screenshots/demarrage.png) | ![Bienvenue](screenshots/onboarding-bienvenue.png) | ![Auth](screenshots/auth-creation-compte.png) | ![Niveau](screenshots/onboarding-niveau.png) | ![Sélecteur](screenshots/onboarding-selecteur-equipe.png) |

La capture « Démarrage » est prise volontairement **pendant** l'animation, à
900 ms : on y voit le logo en cours de tracé, le nom qui arrive et le ballon en
l'air. Les autres sont prises une fois l'écran posé.

## Fonctionnalités des onglets

| Matchs | Détail d'un match | Organiser un match | Programme | Séance en cours |
|---|---|---|---|---|
| ![Matchs](screenshots/matchs-liste.png) | ![Détail](screenshots/matchs-detail.png) | ![Création](screenshots/matchs-creation.png) | ![Programme](screenshots/entrainement-programme.png) | ![Séance](screenshots/entrainement-seance.png) |

La capture « Séance en cours » est prise pendant l'exercice : le minuteur
circulaire tourne, l'exercice suivant est annoncé. Détail dans
[`docs/features.md`](features.md).

## Autres écrans

| Récapitulatif | Paramètres | Debug thème |
|---|---|---|
| ![Récapitulatif](screenshots/onboarding-recapitulatif.png) | ![Paramètres](screenshots/parametres.png) | ![Debug](screenshots/debug-theme.png) |

## Ce qu'une capture ne montre pas

Les animations sont décrites écran par écran dans
[`docs/motion.md`](motion.md) : tracé du logo, ballon 3D, roulement de la barre
de progression, inclinaison des cartes, onde de validation et confettis.

## Contrôle automatisé

Les mêmes invariants sont vérifiés par les tests, sur **les 181 équipes** et non
sur trois échantillons :

```bash
npm test
```

- `teams.test.ts` — contraste AA de la primaire sur blanc, secondaire distincte,
  fond blanc et texte lisible **pour chaque équipe** ;
- `designSystem.test.tsx` — rendu réel des composants avec les trois thèmes, et
  vérification que le bouton primaire prend bien la couleur du thème ;
- `screens.test.tsx` — rendu réel des 5 onglets, en visiteur et connecté.
