import { registerAs } from '@nestjs/config'
import * as Joi from 'joi'

export type OrmConfigOptions = {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

type OrmConfigEnv = {
  DB_HOST: string
  DB_PORT: string
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_DATABASE: string
  DB_SSL: string
}

export default registerAs<OrmConfigOptions>('database', () => {
  const schema = Joi.object<OrmConfigEnv>({
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.string().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),
    DB_SSL: Joi.string().required(),
  })

  const result = schema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  })

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}. Is there an environment variable missing?`)
  }

  return {
    host: result.value.DB_HOST,
    port: parseInt(result.value.DB_PORT, 10),
    username: result.value.DB_USERNAME,
    password: result.value.DB_PASSWORD,
    database: result.value.DB_DATABASE,
    ssl: result.value.DB_SSL.trim().toLowerCase() === 'true',
  }
})
