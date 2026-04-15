import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export type RedisConfigOptions = {
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
};

export type RedisConfigEnv = {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
};

export default registerAs<RedisConfigOptions>('redis', () => {
  const schema = Joi.object<RedisConfigEnv>({
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().required(),
    REDIS_PASSWORD: Joi.string().allow('', null).optional(),
  });

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(`REDIS Config Validation Error: ${result.error.message}`);
  }

  return {
    redisHost: result.value.REDIS_HOST,
    redisPort: result.value.REDIS_PORT,
    redisPassword: result.value.REDIS_PASSWORD,
  };
});
