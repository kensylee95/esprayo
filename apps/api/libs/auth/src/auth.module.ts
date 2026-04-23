import { Module } from '@nestjs/common'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { OAuth2Client } from 'google-auth-library'

import AuthConfig from './auth.config'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt.guard'

const GoogleProvider = {
  provide: 'GOOGLE_CLIENT',
  inject: [AuthConfig.KEY],
  useFactory: (config: ConfigType<typeof AuthConfig>) => {
    return new OAuth2Client({client_id: config.googleClientId, client_secret: config.googleClientSecret})
  },
}

@Module({
  imports: [
    ConfigModule.forFeature(AuthConfig),

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(AuthConfig)],
      inject: [AuthConfig.KEY],
      useFactory: (
        config: ConfigType<typeof AuthConfig>,
      ): JwtModuleOptions => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtExpiration as any,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    GoogleProvider,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}