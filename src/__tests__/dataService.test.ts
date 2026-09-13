/**
 * Chargement des données au démarrage.
 *
 * La session est restaurée juste après le premier rendu : un chargement
 * « visiteur » est donc déjà parti quand le compte arrive. Sa réponse ne doit
 * pas écraser celle du chargement authentifié — sinon l'app reste sans amis,
 * séances ni réservations jusqu'au prochain « tirer pour rafraîchir ».
 */
import type { PlayerSummary } from '@/features/social/types';
import { refreshAll } from '@/features/data/service';
import { backend } from '@/lib/backend';
import { useDataStore } from '@/store/dataStore';
import { useProfileStore } from '@/store/profileStore';
import { useSessionStore } from '@/store/sessionStore';

jest.mock('@/lib/backend', () => ({
  backend: {
    listMatches: jest.fn(),
    listSessions: jest.fn(),
    listBookings: jest.fn(),
    listFriends: jest.fn(),
    suggestPlayers: jest.fn(),
    listActivity: jest.fn(),
  },
}));

const mocked = backend as unknown as Record<string, jest.Mock>;

const PLAYER: PlayerSummary = {
  userId: 'demo-rennes-0',
  displayName: 'Yanis',
  avatarUrl: null,
  favoriteTeamId: null,
  city: 'Rennes',
};

/** Promesse dont on choisit l'instant de résolution. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.clearAllMocks();
  useDataStore.getState().reset();
  useProfileStore.setState({ profile: null, draft: { city: 'Rennes' } });
  mocked.listSessions.mockResolvedValue([]);
  mocked.listBookings.mockResolvedValue([]);
  mocked.listFriends.mockResolvedValue([]);
  mocked.listActivity.mockResolvedValue([]);
  mocked.suggestPlayers.mockResolvedValue([PLAYER]);
});

describe('refreshAll', () => {
  it('ignore un chargement visiteur qui se termine après celui du compte', async () => {
    const visitorCall = deferred<never[]>();
    mocked.listMatches.mockImplementation((userId: string | null) =>
      userId === null ? visitorCall.promise : Promise.resolve([]),
    );

    // 1. Premier rendu : pas encore de session, le chargement part et attend.
    useSessionStore.setState({ user: null, status: 'guest' });
    const visitorRefresh = refreshAll();

    // 2. La session est restaurée : le chargement du compte aboutit.
    useSessionStore.setState({
      user: { id: 'u1', email: null, providers: ['email'] },
      status: 'authenticated',
    });
    await refreshAll();
    expect(useDataStore.getState().suggestions).toHaveLength(1);
    expect(useDataStore.getState().loadedFor).toBe('u1');

    // 3. La réponse visiteur arrive enfin : elle doit être sans effet.
    visitorCall.resolve([]);
    await visitorRefresh;

    expect(useDataStore.getState().suggestions).toHaveLength(1);
    expect(useDataStore.getState().loadedFor).toBe('u1');
  });

  it('charge les collections du compte connecté', async () => {
    mocked.listMatches.mockResolvedValue([]);
    useSessionStore.setState({
      user: { id: 'u1', email: null, providers: ['email'] },
      status: 'authenticated',
    });

    await refreshAll();

    expect(mocked.suggestPlayers).toHaveBeenCalledWith('u1', 'Rennes');
    expect(useDataStore.getState().loading).toBe(false);
    expect(useDataStore.getState().loadedAt).not.toBeNull();
  });

  it("laisse les données en place quand le backend échoue", async () => {
    mocked.listMatches.mockResolvedValue([]);
    useSessionStore.setState({
      user: { id: 'u1', email: null, providers: ['email'] },
      status: 'authenticated',
    });
    await refreshAll();

    mocked.suggestPlayers.mockRejectedValue(new Error('réseau'));
    await refreshAll();

    expect(useDataStore.getState().suggestions).toHaveLength(1);
    expect(useDataStore.getState().loading).toBe(false);
  });
});
