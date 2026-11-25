// Jest configuration: TypeScript tests run as native ES modules in a Node.js environment.
// The project is "type": "module" and react-router 8 ships only ES modules, so Jest runs in ESM mode
// (`npm test` sets NODE_OPTIONS=--experimental-vm-modules) and ts-jest emits ES modules.
export default {
  // Use the Node.js test environment, the same runtime the server uses.
  testEnvironment: 'node',
  // Look for tests under src.
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { useESM: true }],
  },
};
