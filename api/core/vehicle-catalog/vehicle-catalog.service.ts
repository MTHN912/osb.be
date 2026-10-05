import { Injectable } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseSearchDto } from '../crud/dto/base-search.dto';

@Injectable()
export class VehicleCatalogService extends CrudService {
  protected readonly modelName = 'VehicleBrand';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async searchBrands(dto: BaseSearchDto) {
    return this.findAllCached({
      where: { ...(dto.where ?? {}), isActive: true },
      orderBy: dto.orderBy ?? [{ sortOrder: 'asc' }, { name: 'asc' }],
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
    });
  }

  async searchModels(dto: BaseSearchDto) {
    return this.findAllCached({
      model: 'VehicleModel',
      where: { ...(dto.where ?? {}), isActive: true },
      include: { brand: { select: { id: true, code: true, name: true } } },
      orderBy: dto.orderBy ?? [{ sortOrder: 'asc' }, { name: 'asc' }],
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
    });
  }
}
