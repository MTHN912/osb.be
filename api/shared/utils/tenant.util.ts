import { BadRequestException } from '@nestjs/common';
import { t } from './i18n.util';

export function requireDealerId(dealerId?: number): number {
  if (!dealerId) {
    throw new BadRequestException(t('DEALER_ID_REQUIRED'));
  }
  return dealerId;
}
