// jest.config.ts (at C:/Users/HP EliteBook 840 G7/Desktop/Fidex/jest.config.ts)
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Map TypeScript paths (@modules/*, @libs/*) to correct locations
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Do not hardcode roots — let apps/libraries define them if needed
};