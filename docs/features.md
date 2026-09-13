# Fonctionnalités des onglets

Le cahier des charges initial interdisait les fonctionnalités métier (« ne les
invente pas, reste dans ce périmètre »). Ce périmètre a été ouvert ensuite : ce
document décrit ce que chaque onglet fait désormais, et comment c'est bâti.

---

## Principe : une seule couche, deux backends

```
écran  →  src/features/data/service.ts  →  backend  →  démo local | Supabase
                                             ↓
                                      src/store/dataStore.ts
```

Aucun écran n'appelle Supabase directement. Le contrat `Backend`
(`src/lib/backend/types.ts`) décrit 16 opérations métier, implémentées **deux
fois** : en local sur AsyncStorage, et sur Supabase. C'est ce qui permet à
l'app de fonctionner sans aucune configuration, avec le même code.

Les **catalogues** (exercices, programmes, terrains, badges) sont embarqués dans
l'app, pas en base : ils sont identiques pour tout le monde, doivent marcher
hors ligne, et n'ont donc rien à faire dans une table.

---

## Home — le tableau de bord

Trois questions, dans cet ordre : quand est-ce que je rejoue, qu'est-ce que je
fais aujourd'hui, que font les autres.

- **Prochain match** : le premier match à venir auquel on participe, ou une
  invitation à en rejoindre / organiser un ;
- **Séance du jour** : le programme le mieux adapté au niveau déclaré pendant
  l'onboarding, avec la série de jours consécutifs ;
- **Activité** : les trois derniers faits de ses amis ;
- **Ton mois** : matchs joués, séances, amis ;
- **Raccourcis** vers les quatre autres écrans.

## Matchs

Accessible depuis Home et les raccourcis (`/matches`).

- Deux listes : **à rejoindre** (matchs ouverts et à venir de sa ville) et
  **mes matchs** ;
- **Organiser** : format (foot à 5, futsal, à 7, à 11), niveau attendu, jour,
  heure, durée, lieu, ville, précisions. Aucun sélecteur de date natif — que des
  choix tapables, pour tenir en quelques secondes ;
- **Détail** : informations, liste des participants, et l'action correspondant à
  son rôle — rejoindre, quitter, ou annuler pour l'organisateur (double
  confirmation).

Les règles de participation sont dans `src/features/matches/types.ts` et
testées : on ne rejoint pas un match complet, annulé, déjà commencé, ni deux fois.
Un match n'est « terminé » qu'après son coup d'envoi **plus** sa durée.

## Entraînement

- **Catalogue embarqué** : 16 exercices (technique, physique, frappe, défense,
  gardien) et 5 programmes, tous réalisables seul avec au plus un ballon, des
  plots et un mur ;
- **Lecteur de séance** plein écran : préparation → effort → récupération →
  exercice suivant, minuteur circulaire, retour haptique à chaque bascule,
  exercice suivant annoncé, pause et saut d'exercice ;
- **Historique** et statistiques : séances, minutes cumulées, série de jours.

Quitter une séance en cours l'enregistre quand même : le temps passé compte.

## Réservation

Il n'existe **aucun annuaire ouvert des terrains amateurs** en France. Plutôt
que d'inventer des noms d'établissements — qui donneraient l'illusion de vraies
adresses — le catalogue décline quatre archétypes génériques dans la ville de
l'utilisateur : « Five indoor », « Futsal », « Terrain de club », « City stade ».
L'écran le dit explicitement.

Les créneaux sont générés de façon déterministe (même ville, même jour, mêmes
disponibilités), les soirées sont plus chargées que les créneaux de journée, et
le passé n'est jamais réservable. L'écran s'ouvre sur le **premier jour où il
reste un créneau** : le soir, tout ce qui restait aujourd'hui est déjà passé, et
atterrir sur une liste vide n'aide personne. Brancher un vrai annuaire ne touchera que
`src/features/booking/venues.ts`.

## Social

- **Demandes reçues** en premier : elles attendent une réponse ;
- **Amis**, **joueurs près de toi**, **fil d'activité**.

## Profil

Statistiques et **12 badges**, tous **calculés** depuis l'activité réelle —
rien n'est stocké, une donnée dérivée qu'on enregistre finit par diverger. Les
badges non décrochés affichent leur progression : « verrouillé » ne veut pas
dire « hors de portée ».

La série de jours ne se casse qu'après **deux** jours sans séance : s'être
entraîné hier mais pas encore aujourd'hui ne doit pas remettre le compteur à zéro.

---

## Confidentialité

Afficher les autres joueurs oblige à lire leur profil. Or `user_profiles`
contient leur **position GPS**, leur club, leur niveau et leurs objectifs.

Une vue `public_profiles` (`supabase/features.sql`) n'expose donc que nom,
avatar, équipe et ville — et applique les réglages de *Paramètres >
Confidentialité* :

| Réglage | Effet |
|---|---|
| Visibilité « public » | profil visible par tous les membres |
| Visibilité « amis » | visible uniquement par les relations acceptées |
| Visibilité « privé » | invisible des autres |
| Position masquée | la ville n'est pas renvoyée |

Les policies RLS des nouvelles tables évitent la récursion grâce à deux
fonctions `security definer` : `are_friends` et `can_see_match`. Sans elles, la
policy de `matches` interrogerait `match_participants`, dont la policy
interrogerait `matches`.

---

## Mode démo

Sans Supabase, l'app sème quelques **profils fictifs** et des matchs ouverts
dans la ville de l'utilisateur — sinon les cinq onglets seraient vides et rien
ne serait essayable. Huit profils par ville, aux prénoms tous distincts.

Rien n'est semé du côté de l'utilisateur : ni match joué, ni séance, ni ami.
Des statistiques et des badges fabriqués donneraient un palmarès que personne
n'a gagné. Ces profils sont explicitement fictifs (prénoms courants,
aucune adresse, aucun contact), n'existent que dans le stockage local de
l'appareil, et disparaissent dès que Supabase est configuré.

---

## Base de données

```bash
# après schema.sql
supabase db push   # ou coller supabase/features.sql dans l'éditeur SQL
```

Six tables : `matches`, `match_participants`, `training_sessions`, `bookings`,
`friendships`, `activities`. Toutes sous RLS, toutes rattachées à
`user_profiles(user_id)` — donc supprimées en cascade avec le compte.

---

## Tests

`src/__tests__/features.test.ts` couvre les règles qui décident ce que
l'utilisateur peut faire : participation à un match, cohérence du catalogue,
génération des créneaux, séries de jours, statistiques et paliers de badges.
