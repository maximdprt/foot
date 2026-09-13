/** Relations entre joueurs et fil d'activité (tables `friendships` et `activities`). */

export type FriendshipStatus = 'pending' | 'accepted';
/** Sens de la demande, vu depuis l'utilisateur courant. */
export type FriendshipDirection = 'incoming' | 'outgoing' | 'mutual';

export interface PlayerSummary {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  favoriteTeamId: string | null;
  city: string | null;
}

export interface Friendship extends PlayerSummary {
  status: FriendshipStatus;
  direction: FriendshipDirection;
  since: string;
}

export type ActivityKind =
  | 'match_created'
  | 'match_joined'
  | 'session_completed'
  | 'booking_created'
  | 'friend_added'
  | 'badge_earned';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  actor: PlayerSummary;
  /** ISO 8601. */
  at: string;
  /** Complément affiché dans la ligne : nom du terrain, du programme, du badge… */
  subject: string | null;
}

/** Demandes reçues, en attente de réponse. */
export function incomingRequests(friends: Friendship[]): Friendship[] {
  return friends.filter((f) => f.status === 'pending' && f.direction === 'incoming');
}

/** Relations effectives. */
export function acceptedFriends(friends: Friendship[]): Friendship[] {
  return friends.filter((f) => f.status === 'accepted');
}

export function compareByDate(a: ActivityItem, b: ActivityItem): number {
  return new Date(b.at).getTime() - new Date(a.at).getTime();
}
