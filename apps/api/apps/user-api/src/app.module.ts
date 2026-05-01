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

@Module({
  imports: [
    //Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [AppConfig, RedisConfig],
    }),

    AuthModule,
    OrmModule,
    RedisProviderModule,
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(RedisConfig)],
      inject: [RedisConfig.KEY],
      useFactory: (config: ConfigType<typeof RedisConfig>) => ({
        connection: {
          host: config.redisHost,
          port: Number(config.redisPort),
          password: config.redisPassword || undefined,
        },
      }),
    }),
    GiftControllerModule,
    AuthControllerModule,
    UsersControllerModule,
    EventControllerModule,

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
