/**
 * Configuration globale de l'application.
 * `APP_NAME` remplace le `[NOM_DE_L'APP]` du cahier des charges : change-le ici
 * (et dans app.json) pour renommer l'app partout.
 */
import Constants from 'expo-constants';

export const APP_NAME = 'Pelouse';

/** Version affichée dans Paramètres > À propos (lue depuis app.json). */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

/** Nombre de taps sur la version pour ouvrir l'écran de debug thème. */
export const DEBUG_TAP_COUNT = 5;

/** Contact support (mailto). */
export const SUPPORT_EMAIL = 'support@pelouse.app';
