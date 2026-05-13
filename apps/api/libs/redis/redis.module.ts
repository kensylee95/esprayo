import { Module, Global } from '@nestjs/common';
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import RedisConfig from './redis.config';
import { ConfigModule, ConfigType } from '@nestjs/config';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule.forFeature(RedisConfig)],
      inject: [RedisConfig.KEY],
      useFactory: (...args: unknown[]): RedisModuleOptions => {
        const config = args[0] as ConfigType<typeof RedisConfig>;
        return {
          config: {
            url: config.redisUrl
          },
        };
      },
    }),
  ],
  exports: [RedisModule],
})
export class RedisProviderModule {}
