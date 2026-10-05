import { Module } from '@nestjs/common';
import { VehicleCatalogService } from './vehicle-catalog.service';
import { VehicleCatalogController } from './vehicle-catalog.controller';

@Module({
  controllers: [VehicleCatalogController],
  providers: [VehicleCatalogService],
  exports: [VehicleCatalogService],
})
export class VehicleCatalogModule {}
