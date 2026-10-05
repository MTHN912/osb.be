import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { VehicleCatalogService } from './vehicle-catalog.service';
import { BaseSearchDto } from '../crud/dto/base-search.dto';

@Controller('vehicle-catalog')
export class VehicleCatalogController {
  constructor(private readonly vehicleCatalogService: VehicleCatalogService) {}

  @Post('brands/search')
  @HttpCode(HttpStatus.OK)
  searchBrands(@Body() dto: BaseSearchDto) {
    return this.vehicleCatalogService.searchBrands(dto);
  }

  @Post('models/search')
  @HttpCode(HttpStatus.OK)
  searchModels(@Body() dto: BaseSearchDto) {
    return this.vehicleCatalogService.searchModels(dto);
  }
}
