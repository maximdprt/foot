/**
 * Tests de la validation du questionnaire d'onboarding (section 8) :
 * activation du bouton « Continuer », complétude du profil et reprise à
 * l'étape sauvegardée.
 */
import {
  COUNTED_STEPS,
  firstIncompleteStep,
  isOnboardingComplete,
  isStepValid,
  LAST_STEP_INDEX,
  ONBOARDING_STEPS,
  stepAt,
  stepIndex,
  stepProgress,
} from '@/features/onboarding/steps';
import type { ProfileDraft } from '@/features/profile/types';
import { validateDisplayName } from '@/lib/validation';

const complete: ProfileDraft = {
  displayName: 'Kylian',
  playsFootball: 'regularly',
  level: 'confirmed',
  clubName: null,
  position: 'forward',
  region: 'idf',
  city: 'Paris',
  playLocations: ['five_indoor', 'club_pitch'],
  frequency: 'weekly_2_3',
  goals: ['improve', 'fitness'],
  favoriteTeamId: 'psg',
};

describe('déclaration des étapes', () => {
  it('suit l ordre du cahier des charges', () => {
    expect(ONBOARDING_STEPS.map((s) => s.key)).toEqual([
      'welcome',
      'identity',
      'plays',
      'level',
      'club',
      'position',
      'location',
      'play-locations',
      'frequency',
      'goals',
      'team',
      'summary',
    ]);
    expect(LAST_STEP_INDEX).toBe(11);
    expect(COUNTED_STEPS).toBe(11);
  });

  it('marque « club » et « équipe de cœur » comme facultatifs', () => {
    const optional = ONBOARDING_STEPS.filter((s) => s.optional).map((s) => s.key);
    expect(optional).toEqual(['club', 'team']);
  });

  it('borne les index et la progression', () => {
    expect(stepAt(-5).key).toBe('welcome');
    expect(stepAt(99).key).toBe('summary');
    expect(stepIndex('team')).toBe(10);
    expect(stepProgress(0)).toBe(0);
    expect(stepProgress(LAST_STEP_INDEX)).toBe(1);
    expect(stepProgress(999)).toBe(1);
  });

  it('donne des routes uniques', () => {
    const paths = ONBOARDING_STEPS.map((s) => s.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('validation du pseudo', () => {
  it('refuse le vide, le trop court et le trop long', () => {
    expect(validateDisplayName('')).toBe('empty');
    expect(validateDisplayName('   ')).toBe('empty');
    expect(validateDisplayName('K')).toBe('too_short');
    expect(validateDisplayName('K'.repeat(25))).toBe('too_long');
    expect(validateDisplayName('Kylian')).toBeNull();
  });
});

describe('isStepValid', () => {
  it('exige une réponse aux étapes obligatoires', () => {
    expect(isStepValid('identity', {})).toBe(false);
    expect(isStepValid('plays', {})).toBe(false);
    expect(isStepValid('level', {})).toBe(false);
    expect(isStepValid('position', {})).toBe(false);
    expect(isStepValid('frequency', {})).toBe(false);
    expect(isStepValid('play-locations', { playLocations: [] })).toBe(false);
  });

  it('accepte les étapes facultatives et les écrans d information sans réponse', () => {
    expect(isStepValid('welcome', {})).toBe(true);
    expect(isStepValid('club', {})).toBe(true);
    expect(isStepValid('team', {})).toBe(true);
    expect(isStepValid('summary', {})).toBe(true);
  });

  it('exige région ET ville pour la localisation', () => {
    expect(isStepValid('location', { region: 'idf' })).toBe(false);
    expect(isStepValid('location', { city: 'Paris' })).toBe(false);
    expect(isStepValid('location', { region: 'idf', city: 'Paris' })).toBe(true);
  });

  it('limite les objectifs à 1–3', () => {
    expect(isStepValid('goals', { goals: [] })).toBe(false);
    expect(isStepValid('goals', { goals: ['improve'] })).toBe(true);
    expect(isStepValid('goals', { goals: ['improve', 'fitness', 'fun'] })).toBe(true);
    expect(isStepValid('goals', { goals: ['improve', 'fitness', 'fun', 'compete'] })).toBe(false);
  });
});

describe('complétude et reprise', () => {
  it('reconnaît un profil complet', () => {
    expect(isOnboardingComplete(complete)).toBe(true);
  });

  it('reste incomplet si une réponse obligatoire manque', () => {
    const { frequency: _omitted, ...withoutFrequency } = complete;
    expect(isOnboardingComplete(withoutFrequency)).toBe(false);
  });

  it('reste complet sans club ni équipe de cœur (facultatifs)', () => {
    expect(isOnboardingComplete({ ...complete, clubName: null, favoriteTeamId: null })).toBe(true);
  });

  it('reprend à la première étape obligatoire non satisfaite', () => {
    expect(firstIncompleteStep({})).toBe(stepIndex('identity'));
    expect(firstIncompleteStep({ displayName: 'Kylian' })).toBe(stepIndex('plays'));
    expect(firstIncompleteStep(complete)).toBe(LAST_STEP_INDEX);
  });

  it('ignore les étapes facultatives pour la reprise', () => {
    const { clubName: _club, favoriteTeamId: _team, ...rest } = complete;
    expect(firstIncompleteStep(rest)).toBe(LAST_STEP_INDEX);
  });
});
