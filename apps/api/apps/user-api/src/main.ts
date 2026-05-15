import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  //delete when domain is set
  app.enableCors();
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true });

  /*const appConfig = configService.get<AppConfigOptions>(
    'app',
  ) as AppConfigOptions;
   */

  //const port = process.env.PORT || appConfig.port || 8080;
  await app.listen(3001, '0.0.0.0');
}
bootstrap();
