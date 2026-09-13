/**
 * Fumigation des écrans : chaque onglet, l'écran d'authentification, une question
 * d'onboarding et les Paramètres se rendent réellement, en visiteur comme
 * connecté, et affichent les textes attendus (contrôle des clés i18n en contexte).
 */
import React, { type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import { useProfileStore } from '@/store/profileStore';
import { useSessionStore } from '@/store/sessionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

import SignInScreen from '../../app/(auth)/sign-in';
import LevelScreen from '../../app/(onboarding)/level';
import BookingScreen from '../../app/(tabs)/booking';
import HomeScreen from '../../app/(tabs)/index';
import ProfileScreen from '../../app/(tabs)/profile';
import SocialScreen from '../../app/(tabs)/social';
import TrainingScreen from '../../app/(tabs)/training';
import SettingsScreen from '../../app/settings/index';

// Les écrans n'utilisent du routeur que la navigation impérative et les params.
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  return {
    ...actual,
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
    useLocalSearchParams: () => ({}),
  };
});

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function render(node: ReactNode): ReactTestRenderer {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <ThemeProvider fontsLoaded={false}>{node}</ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return tree;
}

type Json = ReturnType<ReactTestRenderer['toJSON']>;

/** Concatène tous les textes rendus, pour vérifier qu'aucune clé i18n ne fuit. */
function textOf(tree: ReactTestRenderer): string {
  const out: string[] = [];
  const walk = (node: Json | string): void => {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
      out.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    node.children?.forEach(walk);
  };
  walk(tree.toJSON());
  return out.join(' | ');
}

function asGuest() {
  act(() => {
    // La langue par défaut dépend de l'appareil : on la fixe pour des assertions stables.
    useSettingsStore.setState({ locale: 'fr' });
    useSessionStore.setState({ status: 'guest', user: null });
    useProfileStore.setState({ profile: null, draft: {} });
    useThemeStore.setState({ favoriteTeamId: 'none', previewTeamId: null });
  });
}

function asMember(teamId = 'paris-saint-germain') {
  act(() => {
    useSettingsStore.setState({ locale: 'fr' });
    useSessionStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'kylian@example.fr', providers: ['email'] },
    });
    useProfileStore.setState({ draft: { displayName: 'Kylian', favoriteTeamId: teamId } });
    useThemeStore.setState({ favoriteTeamId: teamId, previewTeamId: null });
  });
}

afterEach(asGuest);

describe('onglets', () => {
  // Chaque onglet a maintenant un contenu propre : on vérifie qu'il s'affiche,
  // et qu'aucune clé i18n ne fuit (« [missing "fr.x.y" translation] »).
  it.each([
    ['Home', HomeScreen, 'Ton prochain match'],
    ['Entraînement', TrainingScreen, 'Programmes'],
    // Sans ville renseignée, l'onglet Réservation invite d'abord à la saisir.
    ['Réservation', BookingScreen, 'Renseigne ta ville'],
    ['Social', SocialScreen, 'Amis'],
    ['Profil', ProfileScreen, 'Statistiques'],
  ])('rend l onglet %s en visiteur', (_name, Screen, marker) => {
    asGuest();
    const tree = render(<Screen />);
    const text = textOf(tree);
    expect(tree.toJSON()).toBeTruthy();
    expect(text).toContain(marker);
    expect(text).not.toMatch(/missing .* translation/);
    act(() => tree.unmount());
  });

  it('propose de rejoindre ou d organiser quand aucun match n est prévu', () => {
    asGuest();
    const tree = render(<HomeScreen />);
    const text = textOf(tree);
    expect(text).toContain('Aucun match prévu');
    expect(text).toContain('Rejoindre');
    expect(text).toContain('Organiser');
    act(() => tree.unmount());
  });

  it('met en avant une séance et son catalogue traduit', () => {
    asGuest();
    const tree = render(<TrainingScreen />);
    const text = textOf(tree);
    // Le catalogue passe par l'i18n : son nom prouve que les clés sont résolues.
    expect(text).toContain('Touche rapide');
    expect(text).toContain('Spécial gardien');
    act(() => tree.unmount());
  });

  it('liste les terrains une fois la ville connue', () => {
    asMember();
    act(() => {
      useProfileStore.setState({ draft: { displayName: 'Kylian', city: 'Rennes' } });
    });
    const tree = render(<BookingScreen />);
    const text = textOf(tree);
    expect(text).toContain('Terrains près de toi');
    expect(text).toContain('Five indoor');
    expect(text).toContain('City stade');
    act(() => tree.unmount());
  });

  it('affiche les badges à débloquer sur le profil', () => {
    asMember();
    const tree = render(<ProfileScreen />);
    const text = textOf(tree);
    expect(text).toContain('Badges');
    expect(text).toContain('Première séance');
    // Aucun badge décroché au départ : le compteur le dit.
    expect(text).toContain('0 sur 12');
    act(() => tree.unmount());
  });

  it('affiche la carte visiteur sur Home, et le prénom une fois connecté', () => {
    asGuest();
    const guest = render(<HomeScreen />);
    expect(textOf(guest)).toContain('Crée ton profil pour personnaliser ton app');
    expect(textOf(guest)).toContain('Salut 👋');
    act(() => guest.unmount());

    asMember();
    const member = render(<HomeScreen />);
    expect(textOf(member)).toContain('Salut Kylian 👋');
    expect(textOf(member)).not.toContain('Crée ton profil pour personnaliser ton app');
    act(() => member.unmount());
  });

  it('montre l équipe supportée sur le Profil', () => {
    asMember();
    const tree = render(<ProfileScreen />);
    expect(textOf(tree)).toContain('Paris Saint-Germain');
    act(() => tree.unmount());
  });
});

describe('authentification et onboarding', () => {
  it('rend l écran de création de compte avec Apple et Google en premier', () => {
    asGuest();
    const tree = render(<SignInScreen />);
    const text = textOf(tree);
    expect(text).toContain('Continuer avec Apple');
    expect(text).toContain('Continuer avec Google');
    expect(text).toContain('Créer mon compte');
    expect(text.indexOf('Continuer avec Apple')).toBeLessThan(text.indexOf('Créer mon compte'));
    act(() => tree.unmount());
  });

  it('rend une question du questionnaire avec ses réponses', () => {
    asGuest();
    const tree = render(<LevelScreen />);
    const text = textOf(tree);
    expect(text).toContain('Ton niveau ?');
    ['Débutant', 'Loisir', 'Confirmé', 'Compétition (club fédéral)', 'Haut niveau / semi-pro'].forEach(
      (option) => expect(text).toContain(option),
    );
    expect(text).toContain('Continuer');
    act(() => tree.unmount());
  });
});

describe('paramètres', () => {
  it('affiche la version réduite pour un visiteur', () => {
    asGuest();
    const tree = render(<SettingsScreen />);
    const text = textOf(tree);
    ['Apparence', 'Langue', 'Aide & support', 'À propos'].forEach((section) =>
      expect(text).toContain(section),
    );
    expect(text).not.toContain('Se déconnecter');
    act(() => tree.unmount());
  });

  it('affiche toutes les sections pour un utilisateur connecté', () => {
    asMember();
    const tree = render(<SettingsScreen />);
    const text = textOf(tree);
    ['Compte', 'Mon profil', 'Apparence', 'Notifications', 'Confidentialité', 'Langue', 'À propos'].forEach(
      (section) => expect(text).toContain(section),
    );
    expect(text).toContain('Se déconnecter');
    act(() => tree.unmount());
  });
});

describe('changement de langue', () => {
  it('bascule instantanément tout l écran en anglais', () => {
    asGuest();
    const fr = render(<TrainingScreen />);
    expect(textOf(fr)).toContain('Touche rapide');
    act(() => fr.unmount());

    act(() => {
      useSettingsStore.setState({ locale: 'en' });
    });
    const en = render(<TrainingScreen />);
    expect(textOf(en)).toContain('Programs');
    expect(textOf(en)).toContain('Quick touch');
    expect(textOf(en)).not.toContain('Touche rapide');
    // Garde-fou : « Programmes » était resté tel quel dans la version anglaise.
    expect(textOf(en)).not.toContain('Programmes');
    act(() => en.unmount());
  });
});
