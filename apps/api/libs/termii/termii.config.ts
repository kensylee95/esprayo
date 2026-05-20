import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

type TermiiConfigEnv = {
  TERMII_API_KEY: string;
  TERMII_SENDER_ID: string;
  TERMII_BASE_URL: string;
};

export default registerAs('termii', () => {
  const schema = Joi.object<TermiiConfigEnv>({
    TERMII_API_KEY: Joi.string().required(),
    TERMII_SENDER_ID: Joi.string().default('N-Alert'),
    TERMII_BASE_URL: Joi.string().uri().default('https://v3.api.termii.com'),
  });

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return {
    apiKey: result.value.TERMII_API_KEY,
    senderId: result.value.TERMII_SENDER_ID,
    baseUrl: result.value.TERMII_BASE_URL,
  };
});
