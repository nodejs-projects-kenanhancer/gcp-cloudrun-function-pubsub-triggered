import type { Config } from 'jest';

const commonConfig: Omit<Config, 'displayName' | 'rootDir' | 'testMatch'> = {
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};

const config: Config = {
  rootDir: '.',
  coverageDirectory: 'coverage',
  projects: [
    {
      displayName: 'unit',
      rootDir: 'src',
      testMatch: ['<rootDir>/**/*.spec.ts'],
      ...commonConfig,
    },
    {
      displayName: 'integration',
      rootDir: 'test',
      testMatch: ['<rootDir>/**/integration/**/*.integration.spec.ts'],
      ...commonConfig,
    },
    {
      displayName: 'e2e',
      rootDir: 'test',
      testMatch: ['<rootDir>/**/e2e/**/*.e2e.spec.ts'],
      ...commonConfig,
    },
  ],
};

export default config;
