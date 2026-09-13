/** Session d'authentification (non persistée : le backend est la source de vérité). */
import { create } from 'zustand';

export type AuthProvider = 'email' | 'google' | 'apple';

export interface SessionUser {
  id: string;
  email: string | null;
  providers: AuthProvider[];
}

export type SessionStatus = 'loading' | 'guest' | 'authenticated';

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'loading',
  user: null,
  setUser: (user) => set({ user, status: user ? 'authenticated' : 'guest' }),
}));

export const selectIsAuthenticated = (state: SessionState) => state.status === 'authenticated';
