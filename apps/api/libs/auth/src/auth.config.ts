import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export type AuthConfigOptions = {
  jwtSecret: string;
  jwtExpiration: string;
  googleClientId: string;
  googleClientSecret: string;
};

export type AuthConfigEnv = {
  JWT_EXPIRATION: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export default registerAs<AuthConfigOptions>('auth', () => {
  const schema = Joi.object<AuthConfigEnv>({
    JWT_EXPIRATION: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    GOOGLE_CLIENT_SECRET: Joi.string().required(),
  });

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(`Auth Config Validation Error: ${result.error.message}`);
  }

  return {
    jwtExpiration: result.value.JWT_EXPIRATION,
    jwtSecret: result.value.JWT_SECRET,
    googleClientId: result.value.GOOGLE_CLIENT_ID,
    googleClientSecret: result.value.GOOGLE_CLIENT_SECRET,
  };
});
