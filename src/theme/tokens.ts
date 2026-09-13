/**
 * Design tokens statiques (indépendants de l'équipe supportée).
 * Les couleurs dynamiques (primary, secondary, onPrimary, primarySoft...) sont
 * calculées par `buildTheme`. Aucune couleur ne doit être écrite en dur ailleurs.
 */
import type { TextStyle } from 'react-native';

/** Palette de base « le blanc est la base » (section 5.1). */
export const basePalette = {
  white: '#FFFFFF',
  surface: '#F7F7F8',
  text: '#121212',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  error: '#DC2626',
  grassGreen: '#2E9E5B',
  /** Vert pelouse assombri pour atteindre 4,5:1 sur blanc (texte et icônes). */
  grassGreenAA: '#27864D',
  black: '#121212',
  overlay: '#12121299',
} as const;

/** Palette du mode sombre : prévue par l'architecture, non exposée dans l'UI (« Bientôt »). */
export const darkPalette = {
  background: '#121212',
  surface: '#1E1E20',
  text: '#F7F7F8',
  textSecondary: '#A1A1AA',
  border: '#2A2A2E',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Grille de 4 px. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const sizes = {
  screenPadding: 16,
  sectionGap: 24,
  buttonHeight: 52,
  buttonHeightSmall: 44,
  chipHeight: 36,
  touchTarget: 44,
  tabIcon: 24,
  inputHeight: 52,
  progressBarHeight: 3,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 72,
  avatarXl: 96,
  profileBannerHeight: 120,
  sheetHandleWidth: 40,
} as const;

export const motion = {
  fast: 200,
  normal: 300,
  slow: 400,
} as const;

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label'
  | 'button';

export type FontWeight = '400' | '500' | '600' | '700' | '800';

/** Noms des faces Inter chargées par expo-font (@expo-google-fonts/inter). */
export const INTER_FACES: Record<FontWeight, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
};

interface TypeSpec {
  size: number;
  lineHeight: number;
  weight: FontWeight;
  letterSpacing?: number;
}

/** Échelle typographique Inter (section 5.3). */
export const typeScale: Record<TypographyVariant, TypeSpec> = {
  h1: { size: 30, lineHeight: 36, weight: '800', letterSpacing: -0.5 },
  h2: { size: 22, lineHeight: 28, weight: '700', letterSpacing: -0.5 },
  h3: { size: 18, lineHeight: 24, weight: '700', letterSpacing: -0.3 },
  body: { size: 16, lineHeight: 22, weight: '400' },
  bodyBold: { size: 16, lineHeight: 22, weight: '600' },
  caption: { size: 13, lineHeight: 18, weight: '500' },
  label: { size: 11, lineHeight: 14, weight: '600' },
  button: { size: 16, lineHeight: 20, weight: '700' },
};

/**
 * Construit les styles texte. Quand Inter est chargée on utilise la face nommée
 * (sans fontWeight, pour éviter le faux-gras) ; sinon on retombe sur la police
 * système avec un fontWeight équivalent.
 */
export function buildTypography(fontsLoaded: boolean): Record<TypographyVariant, TextStyle> {
  const out = {} as Record<TypographyVariant, TextStyle>;
  (Object.keys(typeScale) as TypographyVariant[]).forEach((variant) => {
    const spec = typeScale[variant];
    out[variant] = {
      fontSize: spec.size,
      lineHeight: spec.lineHeight,
      letterSpacing: spec.letterSpacing ?? 0,
      ...(fontsLoaded ? { fontFamily: INTER_FACES[spec.weight] } : { fontWeight: spec.weight }),
    };
  });
  return out;
}

/**
 * Ombre très légère pour les cartes blanches et les sheets.
 *
 * `boxShadow` remplace les anciennes propriétés `shadow*`, dépréciées depuis
 * React Native 0.76 : une seule déclaration pour iOS, Android et le web.
 */
export const shadows = {
  card: { boxShadow: '0px 4px 12px rgba(18, 18, 18, 0.06)' },
  sheet: { boxShadow: '0px -6px 24px rgba(18, 18, 18, 0.12)' },
} as const;
