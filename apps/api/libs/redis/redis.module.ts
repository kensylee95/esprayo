// redis.provider.ts
import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import RedisConfig from './redis.config';
import { ConfigModule, ConfigType } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';
@Global()
@Module({
  imports: [ConfigModule.forFeature(RedisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [RedisConfig.KEY],
      useFactory: (config: ConfigType<typeof RedisConfig>) => {
        const client = new Redis(config.redisUrl, {
          lazyConnect: false,
          keepAlive: 30000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          connectTimeout: 10000,
          retryStrategy: (times) => {
            if (times > 5) return null;
            return Math.min(times * 500, 3000);
          },
        });
        client.on('error', (err) => {
          console.error('Redis client error:', err.message);
        });

        client.on('connect', () => {
          console.log('Redis client connected');
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisProviderModule {}
