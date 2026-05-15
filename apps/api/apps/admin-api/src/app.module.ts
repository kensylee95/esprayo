import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';

import AppConfig from './app.config';
import RedisConfig from '@modules/redis/redis.config';
import Redis from 'ioredis';

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

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) throw new Error('REDIS_URL missing in BullMQ config');

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
})
export class AppModule {}
