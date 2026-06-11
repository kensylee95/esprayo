import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export type PushConfigOptions = {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidMailto: string;
};

export type PushConfigEnv = {
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_MAILTO: string;
};

export default registerAs<PushConfigOptions>('push', () => {
  const schema = Joi.object<PushConfigEnv>({
    VAPID_PUBLIC_KEY: Joi.string().required(),
    VAPID_PRIVATE_KEY: Joi.string().required(),
    VAPID_MAILTO: Joi.string().email().required(),
  });

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (result.error) {
    throw new Error(`Push Config Validation Error: ${result.error.message}`);
  }

  return {
    vapidPublicKey: result.value.VAPID_PUBLIC_KEY,
    vapidPrivateKey: result.value.VAPID_PRIVATE_KEY,
    vapidMailto: result.value.VAPID_MAILTO,
  };
});
