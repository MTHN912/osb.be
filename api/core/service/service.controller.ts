import { Controller, Post, Patch, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto, UpdateServiceDto, UpdateServiceIsActiveDto, AddServiceToPackageDto } from './dto/service.dto';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DealerId } from '../../shared/decorators/dealer-id.decorator';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.createService(dto);
  }

  @Post('add-to-package')
  @UseGuards(JwtAuthGuard)
  addToPackage(@Body() dto: AddServiceToPackageDto) {
    return this.serviceService.addServiceToPackage(dto.packageId, dto.serviceId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.serviceService.updateService(id, dto);
  }

  @Patch(':id/isActive')
  @UseGuards(JwtAuthGuard)
  updateIsActive(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceIsActiveDto) {
    return this.serviceService.updateServiceIsActive(id, dto.isActive);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  search(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.serviceService.searchServices(dto, dealerId);
  }

  @Post('package/:packageId/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  byPackage(@Param('packageId', ParseIntPipe) packageId: number) {
    return this.serviceService.getServicesByPackageId(packageId);
  }

  @Post('public/search')
  @HttpCode(HttpStatus.OK)
  publicSearch(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.serviceService.searchServices(dto, dealerId, true);
  }
}
