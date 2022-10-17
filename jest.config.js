/** @type {import('ts-jest').JestConfigWithTsJest} */

/**
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};


module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
*/

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+/.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/']
};