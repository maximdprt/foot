/**
 * Backend de démonstration 100 % local (AsyncStorage), utilisé quand Supabase
 * n'est pas configuré. Il reproduit fidèlement le contrat de `Backend` afin que
 * les écrans soient identiques dans les deux modes — aucune donnée ne quitte l'appareil.
 *
 * Les mots de passe ne sont volontairement PAS vérifiables côté serveur : ce mode
 * sert uniquement au développement et à la démonstration de l'UI.
 */
import { emptyProfile, mergeDraft, type ProfileDraft, type UserProfile } from '@/features/profile/types';
import { getJSON, setJSON, STORAGE_KEYS } from '@/lib/storage';
import { isValidEmail, isValidPassword, randomId } from '@/lib/validation';
import type { AuthProvider, SessionUser } from '@/store/sessionStore';
import type { UserSettings } from '@/store/settingsStore';

import { AuthError, type Backend, type SignUpResult } from './types';

interface DemoAccount {
  id: string;
  email: string | null;
  /** Stocké en clair : mode démo local uniquement (cf. en-tête de fichier). */
  password: string | null;
  providers: AuthProvider[];
}

interface DemoDb {
  accounts: Record<string, DemoAccount>;
  profiles: Record<string, UserProfile>;
  settings: Record<string, Partial<UserSettings>>;
  currentUserId: string | null;
}

const EMPTY_DB: DemoDb = { accounts: {}, profiles: {}, settings: {}, currentUserId: null };

let cache: DemoDb | null = null;
const listeners = new Set<(user: SessionUser | null) => void>();

async function read(): Promise<DemoDb> {
  if (!cache) cache = (await getJSON<DemoDb>(STORAGE_KEYS.localBackend)) ?? { ...EMPTY_DB };
  return cache;
}

async function write(db: DemoDb): Promise<void> {
  cache = db;
  await setJSON(STORAGE_KEYS.localBackend, db);
}

function toSessionUser(account: DemoAccount): SessionUser {
  return { id: account.id, email: account.email, providers: account.providers };
}

function emit(user: SessionUser | null): void {
  listeners.forEach((listener) => listener(user));
}

function accountKey(email: string): string {
  return email.trim().toLowerCase();
}

export const demoBackend: Backend = {
  isDemo: true,

  async getSession() {
    const db = await read();
    const account = db.currentUserId ? Object.values(db.accounts).find((a) => a.id === db.currentUserId) : null;
    return account ? toSessionUser(account) : null;
  },

  onSessionChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async signUpWithEmail(email, password): Promise<SignUpResult> {
    if (!isValidEmail(email)) throw new AuthError('emailInvalid');
    if (!isValidPassword(password)) throw new AuthError('passwordTooShort');
    const db = await read();
    const key = accountKey(email);
    if (db.accounts[key]) throw new AuthError('emailTaken');
    const account: DemoAccount = { id: randomId('user'), email: key, password, providers: ['email'] };
    db.accounts[key] = account;
    db.currentUserId = account.id;
    await write(db);
    const user = toSessionUser(account);
    emit(user);
    return { user, needsEmailConfirmation: false };
  },

  async signInWithEmail(email, password) {
    if (!isValidEmail(email)) throw new AuthError('emailInvalid');
    const db = await read();
    const account = db.accounts[accountKey(email)];
    if (!account || account.password !== password) throw new AuthError('invalidCredentials');
    db.currentUserId = account.id;
    await write(db);
    const user = toSessionUser(account);
    emit(user);
    return user;
  },

  async signInWithProvider(provider) {
    const db = await read();
    const key = `${provider}@demo.local`;
    const account: DemoAccount = db.accounts[key] ?? {
      id: randomId('user'),
      email: key,
      password: null,
      providers: [provider],
    };
    if (!account.providers.includes(provider)) account.providers.push(provider);
    db.accounts[key] = account;
    db.currentUserId = account.id;
    await write(db);
    const user = toSessionUser(account);
    emit(user);
    return user;
  },

  async sendPasswordReset(email) {
    if (!isValidEmail(email)) throw new AuthError('emailInvalid');
    // Mode démo : aucun email n'est envoyé, on ne révèle pas si le compte existe.
  },

  async updatePassword(password) {
    if (!isValidPassword(password)) throw new AuthError('passwordTooShort');
    const db = await read();
    const entry = Object.entries(db.accounts).find(([, a]) => a.id === db.currentUserId);
    if (!entry) throw new AuthError('generic');
    db.accounts[entry[0]] = { ...entry[1], password };
    await write(db);
  },

  async signOut() {
    const db = await read();
    db.currentUserId = null;
    await write(db);
    emit(null);
  },

  async deleteAccount() {
    const db = await read();
    const id = db.currentUserId;
    if (id) {
      const entry = Object.entries(db.accounts).find(([, a]) => a.id === id);
      if (entry) delete db.accounts[entry[0]];
      delete db.profiles[id];
      delete db.settings[id];
    }
    db.currentUserId = null;
    await write(db);
    emit(null);
  },

  async fetchProfile(userId) {
    const db = await read();
    return db.profiles[userId] ?? null;
  },

  async saveProfile(userId, patch: ProfileDraft) {
    const db = await read();
    const base = db.profiles[userId] ?? emptyProfile(userId);
    const next = mergeDraft(base, patch);
    next.id = base.id ?? randomId('profile');
    next.updatedAt = new Date().toISOString();
    next.createdAt = base.createdAt ?? next.updatedAt;
    db.profiles[userId] = next;
    await write(db);
    return next;
  },

  async uploadAvatar(_userId, localUri) {
    // Mode démo : on conserve l'URI locale telle quelle.
    return localUri;
  },

  async fetchSettings(userId) {
    const db = await read();
    return db.settings[userId] ?? null;
  },

  async saveSettings(userId, settings) {
    const db = await read();
    db.settings[userId] = settings;
    await write(db);
  },

  async exportData(userId) {
    const db = await read();
    const entry = Object.values(db.accounts).find((a) => a.id === userId);
    return {
      exportedAt: new Date().toISOString(),
      mode: 'demo-local',
      account: entry ? { id: entry.id, email: entry.email, providers: entry.providers } : null,
      profile: db.profiles[userId] ?? null,
      settings: db.settings[userId] ?? null,
    };
  },
};
