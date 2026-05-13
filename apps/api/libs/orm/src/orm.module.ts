import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import OrmConfig from './orm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(OrmConfig)],
      useFactory: (config: ConfigType<typeof OrmConfig>) => {
        return {
          type: 'postgres',
          url: config.databaseUrl,
          synchronize: false,
          schema: 'public',
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        };
      },
      inject: [OrmConfig.KEY],
    }),
  ],
})
export class OrmModule { }
