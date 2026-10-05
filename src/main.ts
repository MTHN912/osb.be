import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, LogLevel, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '../api/shared/exceptions/http-exception.filter';
import { getProcessEnvOrThrow } from '../api/shared/utils/env.util';
import { t } from '../api/shared/utils/i18n.util';

async function bootstrap() {
  const logLevels = getProcessEnvOrThrow('LOG_LEVELS')
    .split(',')
    .map((l) => l.trim()) as LogLevel[];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  const logger = new Logger('Bootstrap');
  logger.log(t('ACTIVE_LOG_LEVELS', { levels: logLevels.join(', ') }));

  const corsUrlEnv = getProcessEnvOrThrow('CORS_URL');
  const allowedOrigins = corsUrlEnv
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const isAllowAll = allowedOrigins.includes('*');
  app.enableCors({
    origin: isAllowAll ? true : allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  logger.log(t('CORS_ORIGINS', { origins: isAllowAll ? '*' : allowedOrigins.join(', ') }));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = getProcessEnvOrThrow('PORT');
  await app.listen(port);
  logger.log(t('SERVER_STARTED', { port }));
}

bootstrap();
