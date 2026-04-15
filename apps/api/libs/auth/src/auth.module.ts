import { Module } from '@nestjs/common'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt'
import AuthConfig from './auth.config'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt.guard'


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forFeature(AuthConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(AuthConfig)],
      useFactory: (config: ConfigType<typeof AuthConfig>): JwtModuleOptions => {
        return {
          secret: config.jwtSecret,
          signOptions: { expiresIn: config.jwtExpiration as number | `${number}${"s" | "m" | "h" | "d"}`},
        }
      },
      inject: [AuthConfig.KEY],
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
