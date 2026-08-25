module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/libs/$1/src',
  },
  setupFiles: ['reflect-metadata'],
};
