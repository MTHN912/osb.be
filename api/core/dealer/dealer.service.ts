import { Injectable } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { UpdateOperatingHourDto } from './dto/dealer.dto';
import { DEALER_DEFAULT_INCLUDE } from './constants/dealer.constant';

type DealerRecord = Record<string, any> & { dealerPackages?: { package?: { code: string } }[] };

function formatDealer(dealer: DealerRecord) {
  return {
    ...dealer,
    supportedPackages: (dealer.dealerPackages ?? []).map((dp) => dp.package?.code).filter(Boolean),
  };
}

@Injectable()
export class DealerService extends CrudService {
  protected readonly modelName = 'Dealer';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async searchDealers(dto: BaseSearchDto) {
    const result = await this.findAllCached<DealerRecord>({
      where: dto.where,
      include: dto.include ?? DEALER_DEFAULT_INCLUDE,
      orderBy: dto.orderBy ?? { id: 'asc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
    });
    return { ...result, data: result.data.map(formatDealer) };
  }

  async getDealerPublic(dealerId: number, dto: BaseSearchDto) {
    const dealer = await this.findOneCached<DealerRecord>({
      where: { id: dealerId },
      include: dto.include ?? DEALER_DEFAULT_INCLUDE,
      throwError: true,
    });
    return formatDealer(dealer as DealerRecord);
  }

  async editOperatingHour(dealerId: number, dto: UpdateOperatingHourDto) {
    await this.findOne({ where: { id: dealerId }, throwError: true });
    const schedule = dto.schedule.map((day) => ({ ...day }));
    const existing = await this.findOne({ model: 'OperatingHour', where: {}, dealerId });

    return existing
      ? this.update({ model: 'OperatingHour', where: { id: existing.id }, data: { schedule } })
      : this.create({ model: 'OperatingHour', data: { schedule }, dealerId });
  }
}
