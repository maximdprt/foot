/**
 * Test de rendu du design system : les composants s'affichent réellement et
 * prennent leurs couleurs du thème courant (aucune couleur en dur).
 * Rendre l'app avec trois thèmes différents est le livrable 6 ; ce test en
 * automatise le contrôle sur les composants qui composent tous les écrans.
 */
import { Newspaper } from 'lucide-react-native';
import React, { type ReactNode } from 'react';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import {
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Gradient,
  Input,
  ListItem,
  ListSection,
  ProgressBar,
  SegmentedControl,
  SelectableCard,
  TeamDot,
  Text,
  Tile,
  TileGrid,
  Toggle,
} from '@/components/ui';
import { useThemeStore } from '@/store/themeStore';
import { buildTheme } from '@/theme/buildTheme';
import { getTeam } from '@/theme/teams';
import { ThemeProvider } from '@/theme/ThemeProvider';

function render(node: ReactNode): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(<ThemeProvider fontsLoaded={false}>{node}</ThemeProvider>);
  });
  return tree;
}

/** Rend la galerie complète du design system avec l'équipe demandée. */
function renderGallery(teamId: string): ReactTestRenderer {
  act(() => {
    useThemeStore.setState({ favoriteTeamId: teamId, previewTeamId: null });
  });
  return render(
    <>
      <Text variant="h1">Titre</Text>
      <Button title="Primaire" />
      <Button title="Secondaire" variant="secondary" />
      <Button title="Texte" variant="text" />
      <Button title="Danger" variant="danger" />
      <Card tone="soft">
        <Text>Carte</Text>
      </Card>
      <TileGrid>
        {[
          <Tile key="a" title="Tuile A" />,
          <Tile key="b" title="Tuile B" />,
        ]}
      </TileGrid>
      <Chip label="Chip" selected />
      <Chip label="Chip" />
      <SelectableCard title="Réponse" selected onPress={() => undefined} />
      <Input placeholder="Champ" accessibilityLabel="Champ" />
      <Toggle value onValueChange={() => undefined} accessibilityLabel="Toggle" />
      <ListSection title="Section">
        <ListItem title="Ligne" value="Valeur" />
        <ListItem title="Ligne 2" onPress={() => undefined} />
      </ListSection>
      <Divider />
      <ProgressBar progress={0.5} />
      <SegmentedControl
        options={[
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' },
        ]}
        value="a"
        onChange={() => undefined}
      />
      <Avatar name="Kylian Mbappé" ring />
      <TeamDot team={getTeam(teamId)} showLabel />
      <EmptyState icon={Newspaper} title="Rien ici" />
      <Gradient style={{ height: 120 }} />
    </>,
  );
}

afterEach(() => {
  act(() => {
    useThemeStore.setState({ favoriteTeamId: 'none', previewTeamId: null });
  });
});

describe('rendu du design system', () => {
  it.each(['none', 'paris-saint-germain', 'marseille'])('se rend avec le thème « %s »', (teamId) => {
    const tree = renderGallery(teamId);
    expect(tree.toJSON()).toBeTruthy();
    act(() => tree.unmount());
  });

  it('teinte le bouton primaire avec la couleur du club, pas une valeur en dur', () => {
    const primaryOf = (teamId: string): string => {
      act(() => {
        useThemeStore.setState({ favoriteTeamId: teamId, previewTeamId: null });
      });
      const tree = render(<Button title="Primaire" />);
      // `Pressable` reçoit une fonction de style : on la résout à l'état non pressé.
      const raw = tree.root.findByProps({ accessibilityRole: 'button' }).props.style;
      const styles: unknown = typeof raw === 'function' ? raw({ pressed: false }) : raw;
      const flat = (Array.isArray(styles) ? styles : [styles])
        .flat(3)
        .filter(Boolean) as Record<string, unknown>[];
      const background = flat.find((style) => 'backgroundColor' in style)?.backgroundColor;
      act(() => tree.unmount());
      return String(background);
    };

    const psg = primaryOf('paris-saint-germain');
    const om = primaryOf('marseille');
    const neutral = primaryOf('none');

    expect(psg).toBe(buildTheme(getTeam('paris-saint-germain')).colors.primary);
    expect(om).toBe(buildTheme(getTeam('marseille')).colors.primary);
    expect(neutral).toBe(buildTheme(getTeam('none')).colors.primary);
    expect(new Set([psg, om, neutral]).size).toBe(3);
  });

  it('garde un fond blanc quel que soit le thème', () => {
    ['none', 'paris-saint-germain', 'marseille'].forEach((teamId) => {
      act(() => {
        useThemeStore.setState({ favoriteTeamId: teamId, previewTeamId: null });
      });
      const tree = render(
        <Card tone="elevated">
          <Text>Carte</Text>
        </Card>,
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('#FFFFFF');
      act(() => tree.unmount());
    });
  });
});
