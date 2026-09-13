/**
 * Edge Function « delete-account » (Deno) — suppression RGPD du compte courant.
 *
 * La suppression d'un utilisateur `auth.users` exige la clé `service_role`, qui
 * ne doit jamais être embarquée dans l'application : elle vit uniquement ici.
 * Les lignes `user_profiles`, `user_settings` et les avatars sont supprimés en
 * cascade (`on delete cascade`) ou explicitement ci-dessous.
 *
 * Déploiement :
 *   supabase functions deploy delete-account
 *
 * Ce fichier cible le runtime Deno de Supabase : il est exclu du tsconfig de
 * l'app (voir `tsconfig.json` → `exclude`).
 */
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  const authorization = request.headers.get('Authorization') ?? '';
  const jwt = authorization.replace(/^Bearer\s+/i, '');
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  // On identifie l'appelant à partir de son propre jeton : impossible de
  // supprimer le compte de quelqu'un d'autre.
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }
  const userId = data.user.id;

  // Avatars : le dossier porte l'identifiant de l'utilisateur.
  const { data: files } = await admin.storage.from('avatars').list(userId);
  if (files?.length) {
    await admin.storage.from('avatars').remove(files.map((file) => `${userId}/${file.name}`));
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
