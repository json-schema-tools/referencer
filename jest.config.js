module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: require('path').join(__dirname, 'coverage'),
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: { global: { branches: 70.37, functions: 75, lines: 76.66, statements: 77.77 } },
  resetMocks: true,
  restoreMocks: true,
  rootDir: './src',
  preset: 'ts-jest'
};
