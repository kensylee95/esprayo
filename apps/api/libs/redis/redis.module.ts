// redis.provider.ts
import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import RedisConfig from './redis.config';
import { ConfigModule, ConfigType } from '@nestjs/config';
import redisConfig from './redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';
@Global()
@Module({
  imports: [ConfigModule.forFeature(RedisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [RedisConfig.KEY],
      useFactory: (config: ConfigType<typeof RedisConfig>) => {
        return new Redis(config.redisUrl, {
          lazyConnect: false,
          keepAlive: 30000,
          // Required by BullMQ workers
          maxRetriesPerRequest: null,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisProviderModule { }