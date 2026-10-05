import { Injectable, ConflictException } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { t } from '../../shared/utils/i18n.util';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { SERVICE_DEFAULT_INCLUDE } from './constants/service.constant';

@Injectable()
export class ServiceService extends CrudService {
  protected readonly modelName = 'Service';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createService(dto: CreateServiceDto) {
    const { packageCode, ...data } = dto;
    const pkg = await this.findOne({ model: 'Package', where: { code: packageCode }, throwError: true });

    const service = await this.transaction(async (tx) => {
      const created = await tx.create({ data });
      await tx.create({ model: 'PackageService', data: { packageId: pkg.id, serviceId: created.id } });
      return created;
    });

    return this.findOne({ where: { id: service.id }, include: SERVICE_DEFAULT_INCLUDE });
  }

  async addServiceToPackage(packageId: number, serviceId: number) {
    await this.findOne({ model: 'Package', where: { id: packageId }, throwError: true });
    await this.findOne({ where: { id: serviceId }, throwError: true });

    const existing = await this.findOne({ model: 'PackageService', where: { packageId, serviceId } });
    if (existing) {
      throw new ConflictException(t('SERVICE_ALREADY_IN_PACKAGE'));
    }

    return this.create({
      model: 'PackageService',
      data: { packageId, serviceId },
      include: { package: true, service: true },
    });
  }

  async updateService(id: number, dto: UpdateServiceDto) {
    await this.findOne({ where: { id }, throwError: true });
    return this.update({ where: { id }, data: { ...dto } });
  }

  async updateServiceIsActive(id: number, isActive: boolean) {
    await this.findOne({ where: { id }, throwError: true });
    return this.update({ where: { id }, data: { isActive } });
  }

  async searchServices(dto: BaseSearchDto, dealerId?: number, isPublic = false) {
    const where: Record<string, unknown> = { ...(dto.where ?? {}) };
    if (isPublic) where.isActive = true;
    if (dealerId) where.dealerServices = { some: { dealerId } };

    return this.findAllCached({
      where,
      include: SERVICE_DEFAULT_INCLUDE,
      orderBy: dto.orderBy ?? { sortOrder: 'asc' },
      search: dto.search,
      page: dto.page,
      pageSize: dto.pageSize,
      take: dto.take,
      skip: dto.skip,
    });
  }

  async getServicesByPackageId(packageId: number) {
    const pkg = await this.findOne({
      model: 'Package',
      where: { id: packageId },
      include: { packageServices: { include: { service: true } } },
      throwError: true,
    });
    return pkg.packageServices.map((ps: { service: unknown }) => ps.service);
  }
}
