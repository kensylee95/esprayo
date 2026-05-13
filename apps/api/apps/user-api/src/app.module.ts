import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import RedisConfig from '@modules/redis/redis.config';

import AppConfig from './app.config';
import { GiftControllerModule } from './controllers/gift/gift.controller.module';
import { RedisProviderModule } from '@modules/redis/redis.module';
import { AuthModule } from '@modules/auth/src/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/src';
import { OrmModule } from '@modules/orm/src';
import { AuthControllerModule } from './controllers/auth';
import { UsersControllerModule } from './controllers/users';
import { EventControllerModule } from './controllers/event/event.controller.module';
import { EventGatewayModule } from './getway/event/event.gateway.module';
import { WalletsControllerModule } from './controllers/wallet/wallet.controller.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RealtimeModule } from '@modules/RealtimeGateway/RealtimeGateway.module';

@Module({
  imports: [
    RealtimeModule,
    //Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [AppConfig, RedisConfig],
    }),
    EventEmitterModule.forRoot(),

    AuthModule,
    OrmModule,
    RedisProviderModule,
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(RedisConfig)],
      inject: [RedisConfig.KEY],
      useFactory: (config: ConfigType<typeof RedisConfig>) => ({
        connection: {
          url: config.redisUrl
        },
      }),
    }),
    GiftControllerModule,
    AuthControllerModule,
    UsersControllerModule,
    EventControllerModule,
    WalletsControllerModule,

    EventGatewayModule,
    //Logger
    LoggerModule.forRootAsync({
      inject: [AppConfig.KEY],
      useFactory: (config: ConfigType<typeof AppConfig>) => ({
        pinoHttp: {
          customProps: () => ({ context: 'HTTP' }),
          ...(config.nodeEnv === 'development' && {
            transport: {
              target: 'pino-pretty',
              options: { singleLine: true },
            },
          }),
        },
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
