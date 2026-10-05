import { Injectable } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { CreatePackageDto } from './dto/package.dto';
import { PACKAGE_DEFAULT_INCLUDE } from './constants/package.constant';

@Injectable()
export class PackageService extends CrudService {
  protected readonly modelName = 'Package';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createPackage(dto: CreatePackageDto) {
    return this.create({ data: { ...dto } });
  }

  async searchPackages(dto: BaseSearchDto, dealerId?: number, isPublic = false) {
    const where: Record<string, unknown> = { ...(dto.where ?? {}) };
    if (isPublic) where.isActive = true;
    if (dealerId) where.dealerPackages = { some: { dealerId } };

    return this.findAllCached({
      where,
      include: PACKAGE_DEFAULT_INCLUDE,
      orderBy: dto.orderBy ?? { sortOrder: 'asc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
    });
  }

  async getPackageById(id: number) {
    return this.findOneCached({ where: { id }, include: PACKAGE_DEFAULT_INCLUDE, throwError: true });
  }
}
