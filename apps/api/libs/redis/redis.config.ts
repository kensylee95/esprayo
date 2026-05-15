import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export type RedisConfigOptions = {
  redisUrl: string;
};

export type RedisConfigEnv = {
  REDIS_URL: string;
};

export default registerAs<RedisConfigOptions>('redis', () => {
  const schema = Joi.object<RedisConfigEnv>({
    REDIS_URL: Joi.string().uri().required(),
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
    redisUrl: result.value.REDIS_URL,
  };
});
