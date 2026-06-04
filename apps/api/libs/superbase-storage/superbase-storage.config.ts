import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

type SupabaseStorageConfigEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_STORAGE_BUCKET: string;
};

export default registerAs('supabaseStorage', () => {
  const schema = Joi.object<SupabaseStorageConfigEnv>({
    SUPABASE_URL: Joi.string().uri().required(),
    SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
    SUPABASE_STORAGE_BUCKET: Joi.string().required(),
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
    url: result.value.SUPABASE_URL,
    serviceRoleKey: result.value.SUPABASE_SERVICE_ROLE_KEY,
    bucket: result.value.SUPABASE_STORAGE_BUCKET,
  };
});
