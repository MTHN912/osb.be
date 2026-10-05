import { Injectable } from '@nestjs/common';
import { VehicleSizeClass } from '@prisma/client';
import { CrudService } from '../../core/crud/crud.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VehicleDto } from './dto/vehicle.dto';
import { VEHICLE_DEFAULT_INCLUDE } from './constants/vehicle.constant';

export interface ResolvedVehicle {
  data: {
    plate: string;
    vin?: string;
    brandId: number;
    modelId: number;
    variant?: string;
    year?: number;
    city?: string;
    mileage?: number;
  };
  sizeClass: VehicleSizeClass;
  displayName: string;
}

@Injectable()
export class VehicleService extends CrudService {
  protected readonly modelName = 'Vehicle';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async resolve(dto: VehicleDto): Promise<ResolvedVehicle> {
    const model = await this.findOne({
      model: 'VehicleModel',
      where: { id: dto.vehicleModelId, isActive: true },
      include: { brand: true },
      throwError: true,
    });

    return {
      data: {
        plate: dto.plate,
        vin: dto.vin,
        brandId: model.brandId,
        modelId: model.id,
        variant: dto.variant,
        year: dto.year,
        city: dto.city,
        mileage: dto.mileage,
      },
      sizeClass: model.sizeClass,
      displayName: [model.brand.name, model.name, dto.variant].filter(Boolean).join(' '),
    };
  }

  async listMine(customerId: number) {
    const result = await this.findAll({
      where: { customerId },
      include: VEHICLE_DEFAULT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return result.data;
  }

  async createMine(customerId: number, dto: VehicleDto) {
    const { data } = await this.resolve(dto);
    return this.create({ data: { ...data, customerId }, include: VEHICLE_DEFAULT_INCLUDE });
  }

  async updateMine(customerId: number, id: number, dto: VehicleDto) {
    await this.findOne({ where: { id, customerId }, throwError: true });
    const { data } = await this.resolve(dto);
    return this.update({ where: { id }, data, include: VEHICLE_DEFAULT_INCLUDE });
  }

  async deleteMine(customerId: number, id: number) {
    await this.findOne({ where: { id, customerId }, throwError: true });
    return this.delete({ where: { id } });
  }
}
