import { Controller, Post, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/package.dto';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DealerId } from '../../shared/decorators/dealer-id.decorator';

@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.createPackage(dto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  search(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.packageService.searchPackages(dto, dealerId);
  }

  @Post('public/search')
  @HttpCode(HttpStatus.OK)
  publicSearch(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.packageService.searchPackages(dto, dealerId, true);
  }

  @Post(':id/search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.getPackageById(id);
  }
}
