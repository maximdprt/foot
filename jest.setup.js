/**
 * Configuration Jest commune.
 * AsyncStorage n'a pas de module natif sous Jest : on utilise le mock officiel
 * du paquet, ce qui permet aux stores persistés (zustand) de fonctionner en test.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
