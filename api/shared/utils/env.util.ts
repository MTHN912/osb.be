import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { t } from './i18n.util';

const logger = new Logger('Env');

function missing(key: string): Error {
  const message = t('MISSING_ENV', { key });
  logger.error(message);
  return new Error(message);
}

export function getEnvOrThrow<T = string>(config: ConfigService, key: string): T {
  const value = config.get<T>(key);
  if (value === undefined || value === null || value === '') {
    throw missing(key);
  }
  return value;
}

export function getEnv<T = string>(config: ConfigService, key: string, fallback?: T): T | undefined {
  const value = config.get<T>(key);
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
}

export function getProcessEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw missing(key);
  }
  return value;
}
