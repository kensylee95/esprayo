import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';

import AppConfig from './app.config';
import RedisConfig from '@modules/redis/redis.config';

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
  ],
})
export class AppModule {}
