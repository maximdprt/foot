/**
 * Tests du moteur de thème (section 8) : contraste WCAG AA, calcul de
 * `onPrimary`, application des `themeOverride` et dérivation des tokens.
 */
import {
  contrastRatio,
  darkenToContrast,
  normalizeHex,
  relativeLuminance,
  withAlpha,
} from '@/lib/contrast';
import { buildTheme, NEUTRAL_TEAM, onColor, WCAG_AA_RATIO } from '@/theme/buildTheme';
import type { TeamEntry } from '@/theme/types';

function team(overrides: Partial<TeamEntry> = {}): TeamEntry {
  return {
    id: 'test',
    name: 'Test FC',
    shortName: 'TST',
    city: 'Testville',
    country: 'FR',
    league: 'ligue1',
    colors: { primary: '#004170', secondary: '#DA291C', tertiary: '#FFFFFF' },
    themeOverride: null,
    logoUrl: null,
    ...overrides,
  };
}

describe('utilitaires de contraste', () => {
  it('normalise les formats hex acceptés', () => {
    expect(normalizeHex('#fff')).toBe('#FFFFFF');
    expect(normalizeHex('004170')).toBe('#004170');
    expect(normalizeHex('#004170FF')).toBe('#004170');
    expect(normalizeHex('rouge')).toBeNull();
    expect(normalizeHex(null)).toBeNull();
  });

  it('calcule le contraste WCAG', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('assombrit une couleur jusqu au ratio demandé en conservant la teinte', () => {
    const darkened = darkenToContrast('#FFD700', '#FFFFFF', WCAG_AA_RATIO);
    expect(contrastRatio(darkened, '#FFFFFF')).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
    // Le jaune reste dans les tons chauds (canal rouge dominant).
    expect(parseInt(darkened.slice(1, 3), 16)).toBeGreaterThan(parseInt(darkened.slice(5, 7), 16));
  });

  it('laisse inchangée une couleur déjà conforme', () => {
    expect(darkenToContrast('#004170', '#FFFFFF', WCAG_AA_RATIO)).toBe('#004170');
  });

  it('ajoute un canal alpha', () => {
    expect(withAlpha('#004170', 0.1)).toBe('#0041701A');
  });
});

describe('onColor', () => {
  it('retourne du blanc sur une couleur sombre et du noir sur une couleur claire', () => {
    expect(onColor('#004170')).toBe('#FFFFFF');
    expect(onColor('#FFD700')).toBe('#121212');
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });
});

describe('buildTheme', () => {
  it('produit le thème Neutre pour « aucune équipe »', () => {
    const theme = buildTheme(NEUTRAL_TEAM);
    expect(theme.colors.background).toBe('#FFFFFF');
    expect(theme.colors.text).toBe('#121212');
    expect(theme.meta.teamId).toBe('none');
    // Vert pelouse assombri par un override documenté, pas par l'ajustement automatique.
    expect(theme.meta.overrideApplied).toBe(true);
    expect(theme.meta.primaryAdjusted).toBe(false);
    expect(theme.meta.originalPrimary).toBe('#2E9E5B');
    expect(contrastRatio(theme.colors.primary, '#FFFFFF')).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
  });

  it('garantit AA pour la primaire sur le fond', () => {
    const theme = buildTheme(team({ colors: { primary: '#FFD700', secondary: '#191970', tertiary: '#FFFFFF' } }));
    expect(contrastRatio(theme.colors.primary, theme.colors.background)).toBeGreaterThanOrEqual(
      WCAG_AA_RATIO,
    );
    expect(theme.meta.primaryAdjusted).toBe(true);
    expect(theme.meta.originalPrimary).toBe('#FFD700');
  });

  it('applique themeOverride en priorité', () => {
    const theme = buildTheme(
      team({
        colors: { primary: '#FFFFFF', secondary: '#1B5EAB', tertiary: '#000000' },
        themeOverride: { primary: '#1B5EAB', secondary: '#000000', reason: 'club en blanc' },
      }),
    );
    expect(theme.colors.primary).toBe('#1B5EAB');
    expect(theme.meta.overrideApplied).toBe(true);
    expect(theme.meta.originalPrimary).toBe('#FFFFFF');
  });

  it('assombrit aussi un override non conforme', () => {
    const theme = buildTheme(
      team({ themeOverride: { primary: '#FFEE00', secondary: '#121212', reason: 'test' } }),
    );
    expect(theme.meta.overrideApplied).toBe(true);
    expect(theme.meta.primaryAdjusted).toBe(true);
    expect(contrastRatio(theme.colors.primary, '#FFFFFF')).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
  });

  it('dérive onPrimary, primarySoft et le dégradé', () => {
    const theme = buildTheme(team());
    expect(theme.colors.onPrimary).toBe('#FFFFFF');
    expect(theme.colors.primarySoft).toBe(withAlpha(theme.colors.primary, 0.1));
    expect(theme.gradient).toEqual([theme.colors.primary, theme.colors.secondary]);
  });

  it('écarte une secondaire trop proche de la primaire', () => {
    const theme = buildTheme(
      team({ colors: { primary: '#004170', secondary: '#004372', tertiary: '#FFFFFF' } }),
    );
    expect(theme.colors.secondary).not.toBe('#004372');
    expect(theme.colors.secondary).toBe('#FFFFFF');
  });

  it('expose des tokens stables et un mode sombre déjà prévu', () => {
    const light = buildTheme(team());
    const dark = buildTheme(team(), { mode: 'dark' });
    expect(Object.keys(light.colors)).toEqual(Object.keys(dark.colors));
    expect(dark.colors.background).toBe('#121212');
    expect(dark.meta.mode).toBe('dark');
  });

  it('retombe sur la police système quand Inter n est pas chargée', () => {
    const withInter = buildTheme(team(), { fontsLoaded: true });
    const withoutInter = buildTheme(team(), { fontsLoaded: false });
    expect(withInter.typography.h1.fontFamily).toBe('Inter_800ExtraBold');
    expect(withoutInter.typography.h1.fontFamily).toBeUndefined();
    expect(withoutInter.typography.h1.fontWeight).toBe('800');
  });
});
