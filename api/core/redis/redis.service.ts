import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getEnv, getEnvOrThrow } from '../../shared/utils/env.util';
import { t } from '../../shared/utils/i18n.util';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client?: Redis;
  private readonly ttlSeconds: number = 0;

  constructor(config: ConfigService) {
    const url = getEnv<string>(config, 'REDIS_URL');
    if (!url) {
      this.logger.warn(t('REDIS_NOT_SET'));
      return;
    }
    this.ttlSeconds = Number(getEnvOrThrow<string>(config, 'CACHE_TTL_SECONDS'));
    this.client = new Redis(url, { maxRetriesPerRequest: 1 });
    this.client.on('error', (error) => this.logger.error(error.message));
  }

  get isReady(): boolean {
    return this.client?.status === 'ready';
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isReady) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.error(t('CACHE_READ_FAILED', { key, error: (error as Error).message }));
      return null;
    }
  }

  async setJson(key: string, value: unknown): Promise<void> {
    if (!this.client || !this.isReady) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', this.ttlSeconds);
    } catch (error) {
      this.logger.error(t('CACHE_WRITE_FAILED', { key, error: (error as Error).message }));
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isReady) return;
    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream) {
        if ((keys as string[]).length > 0) {
          await this.client.del(...(keys as string[]));
        }
      }
    } catch (error) {
      this.logger.error(t('CACHE_INVALIDATION_FAILED', { pattern, error: (error as Error).message }));
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }
}
