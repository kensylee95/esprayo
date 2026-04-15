// apps/api/jest.config.ts
import rootConfig from '../../jest.config';

export default {
  ...rootConfig,
  roots: ['<rootDir>/apps/admin-api', '<rootDir>/libs'], // only if you want Jest to look here
};
