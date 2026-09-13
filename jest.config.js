/**
 * Configuration Jest.
 *
 * Deux ajustements par rapport au préréglage `jest-expo` :
 *
 * 1. `transformIgnorePatterns` : les paquets publiés en ESM (Expo, React Native,
 *    lucide, react-native-svg) doivent passer par Babel. Le motif est appliqué au
 *    chemin natif du fichier, d'où la classe `[\\/]` — sous Windows le séparateur
 *    est un antislash.
 * 2. `transform` : le préréglage ne transforme que `.js|.jsx|.ts|.tsx`.
 *    `lucide-react-native` expose du `.mjs` pour la condition « react-native » :
 *    sans cette entrée, Jest le charge tel quel et échoue sur `export`.
 */
const ESM_PACKAGES = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?[\\\\/].*',
  '@expo-google-fonts[\\\\/].*',
  'react-navigation',
  '@react-navigation[\\\\/].*',
  'native-base',
  'react-native-svg',
  'lucide-react-native',
  'standard-navigation',
  'use-latest-callback',
  'nanoid',
].join('|');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [`node_modules[\\\\/](?!(${ESM_PACKAGES}))`],
  transform: {
    '\\.mjs$': [
      'babel-jest',
      { presets: [require.resolve('expo/internal/babel-preset')], babelrc: false, configFile: false },
    ],
  },
};
