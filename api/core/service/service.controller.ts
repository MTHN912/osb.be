import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/service.dto';
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

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  search(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.serviceService.searchServices(dto, dealerId);
  }

  @Post('public/search')
  @HttpCode(HttpStatus.OK)
  publicSearch(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.serviceService.searchServices(dto, dealerId, true);
  }
}
