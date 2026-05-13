import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export type OrmConfigOptions = {
  databaseUrl: string;
};

type OrmConfigEnv = {
  DATABASE_URL: string;
};

export default registerAs<OrmConfigOptions>('database', () => {
  const schema = Joi.object<OrmConfigEnv>({
    DATABASE_URL: Joi.string().required(),
  });

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(
      `Config validation error: ${result.error.message}. Missing DATABASE_URL`,
    );
  }

  return {
    databaseUrl: result.value.DATABASE_URL,
  };
});