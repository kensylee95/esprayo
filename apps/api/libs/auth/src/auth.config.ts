import { registerAs } from '@nestjs/config'
import * as Joi from 'joi'

export type AuthConfigOptions = {
  jwtSecret: string
  jwtExpiration: string
}

export type AuthConfigEnv = {
  JWT_EXPIRATION: string
  JWT_SECRET: string
}

export default registerAs<AuthConfigOptions>('auth', () => {
  const schema = Joi.object<AuthConfigEnv>({
    JWT_EXPIRATION: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
  })

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  })

  if (result.error) {
    throw new Error(`Auth Config Validation Error: ${result.error.message}`)
  }

  return {
    jwtExpiration: result.value.JWT_EXPIRATION,
    jwtSecret: result.value.JWT_SECRET,
  }
})
