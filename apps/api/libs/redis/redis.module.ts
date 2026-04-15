import { Module, Global } from '@nestjs/common';
import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import RedisConfig from './redis.config';
import { ConfigType } from '@nestjs/config';

@Global()
@Module({
    imports: [
        RedisModule.forRootAsync({
            inject: [RedisConfig.KEY],
            useFactory: (...args: unknown[]): RedisModuleOptions => {
                const config = args[0] as ConfigType<typeof RedisConfig>;
                return {
                    config: {
                        host: config.redisHost,
                        port: config.redisPort,
                        password: config.redisPassword,
                    },
                };
            },
        }),
    ],
    exports: [RedisModule],
})
export class RedisProviderModule { }