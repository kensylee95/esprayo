import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import RedisConfig from '@modules/redis/redis.config';

import AppConfig from './app.config';
import { GiftControllerModule } from './controllers/gift/gift.controller.module';
import { RedisProviderModule } from '@modules/redis/redis.module';
import { AuthModule } from '@modules/auth/src/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/src';

@Module({
  imports: [
    //Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
      load: [AppConfig, RedisConfig],
    }),

    //Scheduler (once)
    ScheduleModule.forRoot(),
    AuthModule,
    RedisProviderModule,
    BullModule.forRootAsync({
      inject: [RedisConfig.KEY],
      useFactory: (config: ConfigType<typeof RedisConfig>) => ({
        connection: {
          host: config.redisHost,
          port: Number(config.redisPort),
          password: config.redisPassword,
        },
      }),
    }),
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
    GiftControllerModule
  ],
   providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
