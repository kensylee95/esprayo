import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import RedisConfig from '@modules/redis/redis.config';

import AppConfig from './app.config';
import { GiftControllerModule } from './controllers/gift/gift.controller.module';
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
import Redis from 'ioredis';

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
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () =>
        //config: ConfigService
        {
          const redisUrl =
            'redis://default:ceed33ff15c2463387253a50f33a3a35@fly-throbbing-dawn-1630.upstash.io:6379';
          //if (!redisUrl) throw new Error('REDIS_URL missing in BullMQ config');

          const connection = new Redis(redisUrl, {
            maxRetriesPerRequest: null, // required by BullMQ
            enableReadyCheck: false, // required by BullMQ
            lazyConnect: false,
            keepAlive: 30000,
            connectTimeout: 15000,
            retryStrategy: (times) => {
              if (times > 10) return null;
              return Math.min(times * 1000, 10000);
            },
          });

          connection.on('error', (err) => {
            console.error('BullMQ Redis error:', err.message);
          });

          connection.on('connect', () => {
            console.log('BullMQ Redis connected');
          });

          return { connection };
        },
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
