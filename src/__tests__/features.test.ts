/**
 * Règles métier : participation à un match, catalogue d'entraînement,
 * génération des créneaux, statistiques et badges.
 *
 * Ce sont les règles qui décident ce que l'utilisateur peut faire ; elles se
 * testent sans rendu.
 */
import { slotsFor, venuesForCity, VENUE_KINDS } from '@/features/booking/venues';
import {
  canJoin,
  compareByKickoff,
  FORMAT_PLAYERS,
  hasJoined,
  isFull,
  isPast,
  nextMatchFor,
  spotsLeft,
  type Match,
  type MatchParticipant,
} from '@/features/matches/types';
import { BADGES, computeStats, computeStreaks, sortedBadges } from '@/features/profile/stats';
import { acceptedFriends, incomingRequests, type Friendship } from '@/features/social/types';
import {
  EXERCISES,
  getProgram,
  programExercises,
  PROGRAMS,
  programsForLevel,
} from '@/features/training/catalogue';
import {
  isSessionComplete,
  programDuration,
  programIntensity,
  type TrainingSession,
} from '@/features/training/types';

const HOUR = 3_600_000;

function participant(id: string): MatchParticipant {
  return {
    userId: id,
    displayName: id,
    avatarUrl: null,
    favoriteTeamId: null,
    joinedAt: new Date().toISOString(),
  };
}

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    organizerId: 'organizer',
    organizerName: 'Organisateur',
    format: 'five',
    level: 'all',
    kickoffAt: new Date(Date.now() + 24 * HOUR).toISOString(),
    durationMinutes: 60,
    venueName: 'City stade',
    city: 'Rennes',
    maxPlayers: 10,
    notes: null,
    status: 'open',
    participants: [participant('organizer')],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('participation à un match', () => {
  it('compte les places restantes', () => {
    expect(spotsLeft(match())).toBe(9);
    expect(spotsLeft(match({ participants: Array.from({ length: 10 }, (_, i) => participant(`p${i}`)) }))).toBe(0);
  });

  it('reconnaît un match complet', () => {
    const full = match({ participants: Array.from({ length: 10 }, (_, i) => participant(`p${i}`)) });
    expect(isFull(full)).toBe(true);
    expect(canJoin(full, 'nouveau')).toBe(false);
  });

  it('laisse rejoindre un match ouvert où il reste de la place', () => {
    expect(canJoin(match(), 'nouveau')).toBe(true);
  });

  it('interdit de rejoindre deux fois', () => {
    expect(hasJoined(match(), 'organizer')).toBe(true);
    expect(canJoin(match(), 'organizer')).toBe(false);
  });

  it('interdit de rejoindre un match annulé ou passé', () => {
    expect(canJoin(match({ status: 'cancelled' }), 'nouveau')).toBe(false);
    const past = match({ kickoffAt: new Date(Date.now() - 3 * HOUR).toISOString() });
    expect(isPast(past)).toBe(true);
    expect(canJoin(past, 'nouveau')).toBe(false);
  });

  it("considère un match terminé seulement après son coup d'envoi ET sa durée", () => {
    // Commencé il y a 30 minutes, pour 60 minutes : toujours en cours.
    const running = match({ kickoffAt: new Date(Date.now() - HOUR / 2).toISOString() });
    expect(isPast(running)).toBe(false);
  });

  it('trie les matchs du plus proche au plus lointain', () => {
    const later = match({ id: 'later', kickoffAt: new Date(Date.now() + 48 * HOUR).toISOString() });
    const sooner = match({ id: 'sooner', kickoffAt: new Date(Date.now() + 2 * HOUR).toISOString() });
    expect([later, sooner].sort(compareByKickoff).map((m) => m.id)).toEqual(['sooner', 'later']);
  });

  it('trouve le prochain match de l utilisateur, en ignorant les autres', () => {
    const mine = match({
      id: 'mine',
      kickoffAt: new Date(Date.now() + 5 * HOUR).toISOString(),
      participants: [participant('moi')],
    });
    const others = match({ id: 'autre', kickoffAt: new Date(Date.now() + 2 * HOUR).toISOString() });
    expect(nextMatchFor([others, mine], 'moi')?.id).toBe('mine');
    expect(nextMatchFor([others], 'moi')).toBeNull();
  });

  it('a un effectif cohérent pour chaque format', () => {
    expect(FORMAT_PLAYERS.five).toBe(10);
    expect(FORMAT_PLAYERS.eleven).toBe(22);
    Object.values(FORMAT_PLAYERS).forEach((count) => expect(count % 2).toBe(0));
  });
});

describe("catalogue d'entraînement", () => {
  it('ne référence que des exercices existants', () => {
    PROGRAMS.forEach((program) => {
      expect(programExercises(program)).toHaveLength(program.exerciseIds.length);
    });
  });

  it('a des identifiants et des clés i18n uniques', () => {
    const ids = EXERCISES.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    const programIds = PROGRAMS.map((program) => program.id);
    expect(new Set(programIds).size).toBe(programIds.length);
  });

  it('propose des séances courtes : moins de 25 minutes', () => {
    PROGRAMS.forEach((program) => {
      const minutes = programDuration(program, EXERCISES) / 60;
      expect(minutes).toBeGreaterThan(3);
      expect(minutes).toBeLessThan(25);
    });
  });

  it('calcule une intensité dans la plage attendue', () => {
    PROGRAMS.forEach((program) => {
      expect([1, 2, 3]).toContain(programIntensity(program, EXERCISES));
    });
  });

  it('met les programmes du niveau en tête, sans en perdre', () => {
    const ordered = programsForLevel('beginner');
    expect(ordered).toHaveLength(PROGRAMS.length);
    expect(ordered[0].levels).toContain('beginner');
    // Sans niveau connu, la liste est rendue telle quelle.
    expect(programsForLevel(null)).toEqual(PROGRAMS);
  });

  it('retourne null pour un programme inconnu', () => {
    expect(getProgram('inexistant')).toBeNull();
  });
});

describe('créneaux de réservation', () => {
  it('propose les quatre types de terrain d une ville', () => {
    const venues = venuesForCity('Rennes');
    expect(venues.map((venue) => venue.kind)).toEqual(VENUE_KINDS);
    venues.forEach((venue) => expect(venue.city).toBe('Rennes'));
  });

  it('donne des identifiants stables et distincts par ville', () => {
    const rennes = venuesForCity('Rennes').map((venue) => venue.id);
    expect(venuesForCity('Rennes').map((venue) => venue.id)).toEqual(rennes);
    expect(venuesForCity('Brest').map((venue) => venue.id)).not.toEqual(rennes);
  });

  it('ne propose aucun créneau passé', () => {
    const venue = venuesForCity('Rennes')[0];
    const today = slotsFor(venue, 0);
    const now = Date.now();
    today
      .filter((slot) => slot.available)
      .forEach((slot) => expect(new Date(slot.startsAt).getTime()).toBeGreaterThan(now));
  });

  it('tient dans la plage d ouverture et facture la durée du créneau', () => {
    const venue = venuesForCity('Rennes')[0];
    const slots = slotsFor(venue, 3);
    expect(slots.length).toBeGreaterThan(0);
    slots.forEach((slot) => {
      const start = new Date(slot.startsAt);
      expect(start.getHours()).toBeGreaterThanOrEqual(venue.openingHour);
      expect(new Date(slot.endsAt).getTime() - start.getTime()).toBe(venue.slotMinutes * 60_000);
      if (venue.pricePerHour !== null) expect(slot.price).toBeGreaterThan(0);
    });
  });

  it('rend un city stade gratuit', () => {
    const cityStadium = venuesForCity('Rennes').find((venue) => venue.kind === 'city_stadium');
    expect(cityStadium?.pricePerHour).toBeNull();
    expect(slotsFor(cityStadium!, 2).every((slot) => slot.price === null)).toBe(true);
  });
});

describe('séries de jours', () => {
  const session = (daysAgo: number): TrainingSession => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `s${daysAgo}`,
      programId: 'quick_touch',
      startedAt: date.toISOString(),
      completedAt: date.toISOString(),
      completedExercises: 4,
      totalExercises: 4,
      durationSeconds: 600,
    };
  };

  it('compte les jours consécutifs', () => {
    expect(computeStreaks([session(0), session(1), session(2)])).toEqual({ current: 3, best: 3 });
  });

  it('ne casse pas la série si on ne s est pas encore entraîné aujourd hui', () => {
    expect(computeStreaks([session(1), session(2)]).current).toBe(2);
  });

  it('remet la série à zéro après deux jours sans séance', () => {
    const streaks = computeStreaks([session(5), session(6), session(7)]);
    expect(streaks.current).toBe(0);
    expect(streaks.best).toBe(3);
  });

  it('ne compte qu une fois deux séances du même jour', () => {
    expect(computeStreaks([session(0), session(0)]).current).toBe(1);
  });

  it('ignore les séances abandonnées', () => {
    const abandoned = { ...session(0), completedExercises: 1, totalExercises: 10 };
    expect(isSessionComplete(abandoned)).toBe(false);
    expect(computeStreaks([abandoned]).current).toBe(0);
  });
});

describe('statistiques et badges', () => {
  const friend = (id: string, status: Friendship['status']): Friendship => ({
    userId: id,
    displayName: id,
    avatarUrl: null,
    favoriteTeamId: null,
    city: null,
    status,
    direction: status === 'accepted' ? 'mutual' : 'incoming',
    since: new Date().toISOString(),
  });

  it('ne compte comme joué qu un match passé auquel on participait', () => {
    const played = match({
      kickoffAt: new Date(Date.now() - 3 * HOUR).toISOString(),
      participants: [participant('moi')],
    });
    const upcoming = match({ id: 'futur', participants: [participant('moi')] });
    const stats = computeStats({
      userId: 'moi',
      matches: [played, upcoming, match({ id: 'autre' })],
      sessions: [],
      bookings: [],
      friends: [],
    });
    expect(stats.matchesPlayed).toBe(1);
    expect(stats.matchesUpcoming).toBe(1);
  });

  it('ne compte que les relations acceptées', () => {
    const friends = [friend('a', 'accepted'), friend('b', 'pending')];
    expect(acceptedFriends(friends)).toHaveLength(1);
    expect(incomingRequests(friends)).toHaveLength(1);
    const stats = computeStats({ userId: 'moi', matches: [], sessions: [], bookings: [], friends });
    expect(stats.friends).toBe(1);
  });

  it('décroche le premier badge dès la première séance', () => {
    const stats = computeStats({
      userId: 'moi',
      matches: [],
      sessions: [
        {
          id: 's1',
          programId: 'quick_touch',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          completedExercises: 4,
          totalExercises: 4,
          durationSeconds: 600,
        },
      ],
      bookings: [],
      friends: [],
    });
    const badges = sortedBadges(stats);
    expect(badges[0].earned).toBe(true);
    expect(badges[0].definition.id).toBe('first_touch');
    expect(stats.trainingMinutes).toBe(10);
  });

  it('classe les badges : décrochés d abord, puis les plus proches', () => {
    const badges = sortedBadges(computeStats({ userId: null, matches: [], sessions: [], bookings: [], friends: [] }));
    expect(badges).toHaveLength(BADGES.length);
    expect(badges.every((badge) => !badge.earned)).toBe(true);
    // Sans progression, les ratios sont tous nuls et l'ordre reste stable.
    badges.forEach((badge) => expect(badge.ratio).toBe(0));
  });

  it('a des paliers strictement croissants pour une même statistique', () => {
    const byMetric = new Map<string, number[]>();
    BADGES.forEach((badge) => {
      byMetric.set(badge.metric, [...(byMetric.get(badge.metric) ?? []), badge.threshold]);
    });
    byMetric.forEach((thresholds) => {
      expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds);
      expect(new Set(thresholds).size).toBe(thresholds.length);
    });
  });
});
