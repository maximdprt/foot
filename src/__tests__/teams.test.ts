/**
 * Contrôle du fichier généré `src/theme/teams.json` et du thème produit pour
 * **chaque** équipe : effectifs, unicité, contraste AA, lisibilité des tokens.
 * C'est la contrepartie automatisée du livrable 6 (rendu avec plusieurs thèmes).
 */
import { contrastRatio, normalizeHex, rgbDistance } from '@/lib/contrast';
import { buildTheme, NEUTRAL_TEAM, WCAG_AA_RATIO } from '@/theme/buildTheme';
import {
  getTeam,
  getTeamDisplayName,
  groupTeamsByLeague,
  LEAGUE_ORDER,
  searchTeams,
  TEAMS,
  TEAMS_SEASON,
} from '@/theme/teams';
import type { LeagueId } from '@/theme/types';

/** Effectifs attendus par championnat (section 6.1 du cahier des charges). */
const EXPECTED: Record<Exclude<LeagueId, 'none'>, number> = {
  ligue1: 18,
  ligue2: 18,
  premier_league: 20,
  la_liga: 20,
  serie_a: 20,
  bundesliga: 18,
  liga_portugal: 18,
  eredivisie: 18,
  national: 30,
};

const clubs = TEAMS.filter((team) => team.id !== 'none');

describe('teams.json', () => {
  it('contient tous les championnats aux bons effectifs', () => {
    (Object.keys(EXPECTED) as (keyof typeof EXPECTED)[]).forEach((league) => {
      expect(TEAMS.filter((team) => team.league === league)).toHaveLength(EXPECTED[league]);
    });
    // 8 championnats + 30 sélections + l'entrée « none ».
    expect(TEAMS).toHaveLength(181);
    expect(TEAMS_SEASON).toMatch(/^\d{4}-\d{2}$/);
  });

  it('place le thème Neutre en tête et le résout par défaut', () => {
    expect(TEAMS[0].id).toBe('none');
    expect(getTeam(null).id).toBe(NEUTRAL_TEAM.id);
    expect(getTeam('équipe-inexistante').id).toBe(NEUTRAL_TEAM.id);
  });

  it('a des identifiants uniques et des couleurs hex valides', () => {
    const ids = new Set<string>();
    TEAMS.forEach((team) => {
      expect(ids.has(team.id)).toBe(false);
      ids.add(team.id);
      (['primary', 'secondary', 'tertiary'] as const).forEach((key) => {
        expect(normalizeHex(team.colors[key])).toBe(team.colors[key]);
      });
    });
  });

  it('n embarque aucun écusson officiel (marques déposées)', () => {
    TEAMS.forEach((team) => expect(team.logoUrl).toBeNull());
    clubs.forEach((team) => expect(team.shortName).toMatch(/^[A-Z0-9]{1,5}$/));
  });

  it('documente chaque themeOverride', () => {
    TEAMS.filter((team) => team.themeOverride).forEach((team) => {
      expect(team.themeOverride?.reason?.length ?? 0).toBeGreaterThan(10);
      expect(normalizeHex(team.themeOverride!.primary)).toBe(team.themeOverride!.primary);
    });
  });

  it('inclut la France et les 30 premières nations FIFA', () => {
    const nations = TEAMS.filter((team) => team.league === 'national');
    expect(nations.some((team) => team.id === 'nt-france')).toBe(true);
    nations.forEach((team) => {
      expect(team.fifaRank).toBeGreaterThanOrEqual(1);
      expect(team.nameFr).toBeTruthy();
    });
  });
});

describe('buildTheme sur toutes les équipes', () => {
  it('respecte WCAG AA sur blanc pour chaque primaire', () => {
    const failures = TEAMS.filter(
      (team) => contrastRatio(buildTheme(team).colors.primary, '#FFFFFF') < WCAG_AA_RATIO,
    ).map((team) => team.name);
    expect(failures).toEqual([]);
  });

  it('garde une secondaire distincte de la primaire', () => {
    const failures = TEAMS.filter((team) => {
      const { colors } = buildTheme(team);
      return rgbDistance(colors.secondary, colors.primary) < 24;
    }).map((team) => team.name);
    expect(failures).toEqual([]);
  });

  it('garde le blanc comme fond et un texte lisible, quel que soit le club', () => {
    TEAMS.forEach((team) => {
      const { colors } = buildTheme(team);
      expect(colors.background).toBe('#FFFFFF');
      expect(colors.surface).toBe('#F7F7F8');
      expect(contrastRatio(colors.text, colors.background)).toBeGreaterThan(WCAG_AA_RATIO);
      // onPrimary doit rester lisible sur les boutons pleins.
      expect(contrastRatio(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(3);
    });
  });

  it('produit trois thèmes nettement différents (PSG, OM, Neutre)', () => {
    const psg = buildTheme(getTeam('paris-saint-germain'));
    const om = buildTheme(getTeam('marseille'));
    const neutral = buildTheme(NEUTRAL_TEAM);
    expect(psg.colors.primary).not.toBe(om.colors.primary);
    expect(psg.colors.primary).not.toBe(neutral.colors.primary);
    expect(om.colors.primary).not.toBe(neutral.colors.primary);
  });
});

describe('recherche et regroupement', () => {
  it('groupe par championnat dans l ordre officiel', () => {
    const sections = groupTeamsByLeague(clubs);
    expect(sections.map((s) => s.league)).toEqual(
      LEAGUE_ORDER.filter((league) => clubs.some((team) => team.league === league)),
    );
    expect(sections.every((section) => section.data.length > 0)).toBe(true);
  });

  it('trouve une équipe par nom, abréviation ou ville, sans accents', () => {
    expect(searchTeams('psg').some((team) => team.id === 'paris-saint-germain')).toBe(true);
    expect(searchTeams('Marseille').some((team) => team.id === 'marseille')).toBe(true);
    expect(searchTeams('MARSEILLE').some((team) => team.id === 'marseille')).toBe(true);
    expect(searchTeams('zzzzz')).toHaveLength(0);
    // Une recherche vide renvoie toutes les équipes, « none » exclue.
    expect(searchTeams('')).toHaveLength(clubs.length);
  });

  it('affiche le nom français quand il existe', () => {
    const france = getTeam('nt-france');
    expect(getTeamDisplayName(france, 'fr')).toBe('France');
    expect(getTeamDisplayName(france, 'en')).toBeTruthy();
  });
});
