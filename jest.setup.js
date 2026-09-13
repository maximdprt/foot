/**
 * Configuration Jest commune.
 */

// AsyncStorage n'a pas de module natif sous Jest : on utilise le mock officiel
// du paquet, ce qui permet aux stores persistés (zustand) de fonctionner en test.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/**
 * Le pilote natif d'`Animated` n'existe pas sous Jest : une animation lancée
 * avec `useNativeDriver: true` finit par appeler `getNativeTagFromPublicInstance`,
 * absent du renderer de test, et fait tomber tout le fichier — en particulier
 * les animations à retard, qui démarrent après la fin du test.
 *
 * On force donc le repli JS. Deux précautions :
 *  • `__esModule` est défini non énumérable, un simple spread le perdrait et
 *    l'interop rendrait le module inutilisable ;
 *  • le module par défaut est étendu par héritage plutôt que copié, pour ne pas
 *    déclencher son getter `nativeEventEmitter` au chargement.
 */
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => {
  const actual = jest.requireActual('react-native/src/private/animated/NativeAnimatedHelper');
  const patched = Object.create(actual.default);
  patched.shouldUseNativeDriver = () => false;
  return { __esModule: true, ...actual, default: patched };
});
