/**
 * Couche animation et marque : le tracé du logo reste exploitable, et tous les
 * composants animés se rendent réellement — avec les trois thèmes, et aussi
 * quand l'utilisateur a demandé à réduire les animations.
 */
import React, { type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { Logo } from '@/components/brand/Logo';
import {
  LOGO_ASPECT_RATIO,
  LOGO_PATH,
  LOGO_PATH_LENGTH,
  LOGO_VIEW_BOX,
  LOGO_VIEW_HEIGHT,
  LOGO_VIEW_WIDTH,
} from '@/components/brand/logoPath';
import {
  ConfettiBurst,
  Football3D,
  PitchBackground,
  Shimmer,
  TiltCard,
} from '@/components/motion';
import { ProgressBar, TeamCrest, Text } from '@/components/ui';
import { staggerDelay } from '@/lib/motion';
import { useThemeStore } from '@/store/themeStore';
import { getTeam } from '@/theme/teams';
import { ThemeProvider } from '@/theme/ThemeProvider';

function render(node: ReactNode): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(<ThemeProvider fontsLoaded={false}>{node}</ThemeProvider>);
  });
  return tree;
}

/** Rend puis démonte : vérifie qu'aucune boucle d'animation ne fuit au démontage. */
function renderAndUnmount(node: ReactNode): ReactTestRenderer {
  const tree = render(node);
  expect(tree.toJSON()).toBeTruthy();
  act(() => tree.unmount());
  return tree;
}

afterEach(() => {
  act(() => {
    useThemeStore.setState({ favoriteTeamId: 'none', previewTeamId: null });
  });
  jest.restoreAllMocks();
});

describe('tracé du logo', () => {
  it('est un chemin SVG fermé et exploitable', () => {
    expect(LOGO_PATH.startsWith('M')).toBe(true);
    expect(LOGO_PATH.endsWith('Z')).toBe(true);
    // Le logo d'origine compte une couronne, un joueur, le « 10 » et un ballon :
    // plusieurs contours, donc plusieurs sous-chemins.
    expect(LOGO_PATH.split('M').length - 1).toBeGreaterThan(5);
    expect(LOGO_PATH).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('expose un viewBox cohérent', () => {
    expect(LOGO_VIEW_HEIGHT).toBe(100);
    expect(LOGO_VIEW_WIDTH).toBeGreaterThan(0);
    expect(LOGO_VIEW_BOX).toBe(`0 0 ${LOGO_VIEW_WIDTH} 100`);
    expect(LOGO_ASPECT_RATIO).toBeCloseTo(LOGO_VIEW_WIDTH / 100, 5);
    // Le logo est nettement plus haut que large (silhouette debout).
    expect(LOGO_ASPECT_RATIO).toBeLessThan(1);
  });

  it('fournit une longueur de tracé pour l animation de dessin', () => {
    expect(LOGO_PATH_LENGTH).toBeGreaterThan(100);
    expect(Number.isFinite(LOGO_PATH_LENGTH)).toBe(true);
  });

  it('se rend dans ses trois variantes', () => {
    (['mono', 'gradient', 'outline'] as const).forEach((variant) => {
      renderAndUnmount(<Logo variant={variant} size={64} />);
    });
  });

  it('se rend aussi en mode animé', () => {
    renderAndUnmount(<Logo animated size={80} variant="gradient" />);
  });
});

describe('composants animés', () => {
  it.each(['none', 'paris-saint-germain', 'marseille'])('se rendent avec le thème « %s »', (teamId) => {
    act(() => {
      useThemeStore.setState({ favoriteTeamId: teamId, previewTeamId: null });
    });
    renderAndUnmount(
      <>
        <Logo size={48} variant="gradient" />
        <Football3D size={60} />
        <Football3D size={40} bounce shadow themed />
        <PitchBackground />
        <PitchBackground variant="pitch" />
        <Shimmer width={120} height={14} />
        <ProgressBar progress={0.4} ball />
        <TeamCrest team={getTeam(teamId)} size={80} />
        <ConfettiBurst trigger={1} count={8} />
        <TiltCard>
          <Text>Carte inclinable</Text>
        </TiltCard>
      </>,
    );
  });

  it('la gerbe de confettis ne s affiche pas tant qu elle n est pas déclenchée', () => {
    const tree = render(<ConfettiBurst trigger={0} />);
    expect(tree.toJSON()).toBeNull();
    act(() => tree.unmount());
  });
});

describe('animations réduites', () => {
  it('tous les composants se rendent encore, sans boucle', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    // Le hook lit la préférence de façon asynchrone : on laisse la promesse se résoudre.
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ThemeProvider fontsLoaded={false}>
          <Football3D size={60} bounce />
          <PitchBackground />
          <ProgressBar progress={0.7} ball />
          <Logo animated size={48} />
          <ConfettiBurst trigger={3} />
        </ThemeProvider>,
      );
    });
    expect(tree.toJSON()).toBeTruthy();
    act(() => tree.unmount());
  });
});

describe('cascade', () => {
  it('décale les entrées puis plafonne', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(1)).toBe(55);
    expect(staggerDelay(3)).toBe(165);
    // Au-delà du plafond, le retard n'augmente plus : une longue liste
    // n'attend pas plusieurs secondes avant d'être complète.
    expect(staggerDelay(20)).toBe(staggerDelay(6));
  });
});
