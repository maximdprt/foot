# Supabase

## 1. Schéma et policies

```bash
# Éditeur SQL du projet : coller le contenu de schema.sql
# ou, avec la CLI :
supabase db push
```

`schema.sql` est **idempotent** : il peut être rejoué sans casser une base existante.
Il crée :

- les types énumérés du questionnaire (`plays_football`, `player_level`, …) ;
- `user_profiles`, `user_settings`, `teams` ;
- le déclencheur `on_auth_user_created` qui crée profil et réglages à l'inscription ;
- les **policies RLS** : chaque utilisateur ne lit et n'écrit que ses propres lignes,
  `teams` est en lecture publique ;
- le bucket Storage `avatars`, où chacun n'écrit que dans `"<user_id>/…"`.

## 2. Fournisseurs d'authentification

*Authentication > Providers* :

| Fournisseur | À configurer |
|---|---|
| Email | Activé. Confirmation d'email selon ta politique — l'app gère le cas `confirmEmail`. |
| Google | Client ID / secret Google Cloud. |
| Apple | Services ID + clé Apple. En natif iOS, l'app utilise `expo-apple-authentication` (jeton d'identité + nonce), sinon le flux OAuth web. |

*Authentication > URL Configuration > Redirect URLs* :

```
pelouse://auth-callback
http://localhost:8081
https://<ton-domaine>
```

## 3. Suppression de compte (RGPD)

```bash
supabase functions deploy delete-account
```

La fonction lit le jeton de l'appelant, supprime ses avatars puis son compte
`auth.users` (cascade sur `user_profiles` et `user_settings`). Elle détient seule
la clé `service_role`, qui ne doit jamais être embarquée dans l'application.

## 4. Synchroniser les équipes

`src/theme/teams.json` est embarqué dans l'app ; la table `teams` sert aux
jointures et aux futures fonctionnalités serveur.

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/sync-teams-supabase.mjs
```

À relancer après chaque `npm run teams:build`.
