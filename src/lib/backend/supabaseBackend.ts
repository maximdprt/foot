/**
 * Implémentation Supabase du contrat `Backend` :
 * Auth (email/mot de passe, Google, Apple), table `user_profiles`, table
 * `user_settings`, Storage `avatars`. Les policies RLS (cf. `supabase/schema.sql`)
 * garantissent qu'un utilisateur ne lit et n'écrit que ses propres lignes.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { draftToRow, rowToProfile } from '@/features/profile/mapping';
import { emptyProfile, type UserProfile } from '@/features/profile/types';
import { AVATARS_BUCKET, supabase } from '@/lib/supabase';
import type { AuthProvider, SessionUser } from '@/store/sessionStore';
import type { UserSettings } from '@/store/settingsStore';

import { AuthError, type Backend, type SignUpResult } from './types';

WebBrowser.maybeCompleteAuthSession();

function client() {
  if (!supabase) throw new AuthError('generic');
  return supabase;
}

/** Traduit une erreur Supabase en code i18n `auth.errors.*`. */
function toAuthError(error: { message?: string; status?: number } | null): AuthError {
  const message = (error?.message ?? '').toLowerCase();
  if (message.includes('already registered') || message.includes('already been registered')) {
    return new AuthError('emailTaken');
  }
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return new AuthError('invalidCredentials');
  }
  if (message.includes('not confirmed')) return new AuthError('confirmEmail');
  if (message.includes('password')) return new AuthError('passwordTooShort');
  if (message.includes('email')) return new AuthError('emailInvalid');
  return new AuthError('generic');
}

interface SupabaseIdentity {
  provider: string;
}

interface SupabaseUserLike {
  id: string;
  email?: string | null;
  identities?: SupabaseIdentity[] | null;
  app_metadata?: { providers?: string[]; provider?: string };
}

function toSessionUser(user: SupabaseUserLike | null | undefined): SessionUser | null {
  if (!user) return null;
  const raw = [
    ...(user.identities?.map((i) => i.provider) ?? []),
    ...(user.app_metadata?.providers ?? []),
    user.app_metadata?.provider ?? '',
  ];
  const providers = Array.from(
    new Set(raw.filter((p): p is AuthProvider => p === 'email' || p === 'google' || p === 'apple')),
  );
  return { id: user.id, email: user.email ?? null, providers: providers.length ? providers : ['email'] };
}

/** URL de retour OAuth : `pelouse://auth-callback` en natif, l'origine du site sur le web. */
function redirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: 'pelouse', path: 'auth-callback' });
}

export const supabaseBackend: Backend = {
  isDemo: false,

  async getSession() {
    const { data } = await client().auth.getSession();
    return toSessionUser(data.session?.user as SupabaseUserLike | undefined);
  },

  onSessionChange(listener) {
    const { data } = client().auth.onAuthStateChange((_event, session) => {
      listener(toSessionUser(session?.user as SupabaseUserLike | undefined));
    });
    return () => data.subscription.unsubscribe();
  },

  async signUpWithEmail(email, password): Promise<SignUpResult> {
    const { data, error } = await client().auth.signUp({ email: email.trim(), password });
    if (error) throw toAuthError(error);
    const user = toSessionUser(data.user as SupabaseUserLike | null);
    return { user, needsEmailConfirmation: !data.session };
  },

  async signInWithEmail(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw toAuthError(error);
    const user = toSessionUser(data.user as SupabaseUserLike | null);
    if (!user) throw new AuthError('generic');
    return user;
  },

  async signInWithProvider(provider) {
    if (provider === 'apple' && Platform.OS === 'ios') {
      return signInWithAppleNative();
    }
    const redirectTo = redirectUri();
    const { data, error } = await client().auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
    });
    if (error) throw toAuthError(error);
    if (Platform.OS === 'web') {
      // Le navigateur prend le relais ; la session est détectée au retour sur la page.
      return new Promise<SessionUser>(() => undefined);
    }
    if (!data.url) throw new AuthError('providerUnavailable');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') throw new AuthError('providerUnavailable');
    const params = new URL(result.url.replace('#', '?')).searchParams;
    const code = params.get('code');
    if (code) {
      const exchange = await client().auth.exchangeCodeForSession(code);
      if (exchange.error) throw toAuthError(exchange.error);
      const user = toSessionUser(exchange.data.user as SupabaseUserLike | null);
      if (user) return user;
    }
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const session = await client().auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (session.error) throw toAuthError(session.error);
      const user = toSessionUser(session.data.user as SupabaseUserLike | null);
      if (user) return user;
    }
    throw new AuthError('providerUnavailable');
  },

  async sendPasswordReset(email) {
    const { error } = await client().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUri(),
    });
    if (error) throw toAuthError(error);
  },

  async updatePassword(password) {
    const { error } = await client().auth.updateUser({ password });
    if (error) throw toAuthError(error);
  },

  async signOut() {
    const { error } = await client().auth.signOut();
    if (error) throw toAuthError(error);
  },

  async deleteAccount() {
    // La suppression d'un compte exige la clé service_role : elle passe par une
    // Edge Function « delete-account » déployée avec le projet (cf. supabase/README.md).
    const { error } = await client().functions.invoke('delete-account');
    if (error) throw new AuthError('generic');
    await client().auth.signOut();
  },

  async fetchProfile(userId) {
    const { data, error } = await client()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToProfile(data) : null;
  },

  async saveProfile(userId, patch): Promise<UserProfile> {
    const payload = { ...draftToRow(patch), user_id: userId, updated_at: new Date().toISOString() };
    const { data, error } = await client()
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return data ? rowToProfile(data) : emptyProfile(userId);
  },

  async uploadAvatar(userId, localUri) {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const extension = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error } = await client()
      .storage.from(AVATARS_BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) throw new Error(error.message);
    return client().storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async fetchSettings(userId) {
    const { data, error } = await client()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      notifications: data.notifications as unknown as UserSettings['notifications'],
      privacy: data.privacy as unknown as UserSettings['privacy'],
      appearance: data.appearance as unknown as UserSettings['appearance'],
    };
  },

  async saveSettings(userId, settings) {
    const { error } = await client()
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          notifications: settings.notifications as unknown as Record<string, unknown>,
          privacy: settings.privacy as unknown as Record<string, unknown>,
          appearance: settings.appearance as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    if (error) throw new Error(error.message);
  },

  async exportData(userId) {
    const [profile, settings] = await Promise.all([
      supabaseBackend.fetchProfile(userId),
      supabaseBackend.fetchSettings(userId),
    ]);
    const { data } = await client().auth.getUser();
    return {
      exportedAt: new Date().toISOString(),
      account: { id: data.user?.id ?? userId, email: data.user?.email ?? null },
      profile,
      settings,
    };
  },
};

/** « Se connecter avec Apple » natif (iOS) : jeton d'identité + nonce, puis échange Supabase. */
async function signInWithAppleNative(): Promise<SessionUser> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch {
    throw new AuthError('providerUnavailable');
  }
  if (!credential.identityToken) throw new AuthError('providerUnavailable');
  const { data, error } = await client().auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw toAuthError(error);
  const user = toSessionUser(data.user as SupabaseUserLike | null);
  if (!user) throw new AuthError('generic');
  return user;
}
