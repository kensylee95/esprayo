import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export type AppConfigOptions = {
  port: number;
  nodeEnv: string;
};

type AppConfigEnv = {
  PORT: string;
  NODE_ENV: string;
};

export default registerAs<AppConfigOptions>('app', () => {
  const schema = Joi.object<AppConfigEnv>({
    PORT: Joi.string().required(),
    NODE_ENV: Joi.string().optional().default('production'),
  });

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(
      `Config validation error: ${result.error.message}. Is there an environment variable missing?`,
    );
  }

  return {
    port: parseInt(result.value.PORT, 10),
    nodeEnv: result.value.NODE_ENV,
  };
});
