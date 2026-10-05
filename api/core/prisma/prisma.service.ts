import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { t } from '../../shared/utils/i18n.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log(t('DATABASE_CONNECTED'));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
