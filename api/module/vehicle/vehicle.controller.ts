import { Controller, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleDto } from './dto/vehicle.dto';
import { BaseSearchDto } from '../../core/crud/dto/base-search.dto';
import { CustomerAuthGuard } from '../../core/auth-customer/guards/customer-auth.guard';
import { CurrentUser, AuthUser } from '../../shared/decorators/current-user.decorator';

@Controller(['vehicle', 'vehicles'])
@UseGuards(CustomerAuthGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post('customer/search')
  @HttpCode(HttpStatus.OK)
  searchCustomerVehicles(@CurrentUser() user: AuthUser, @Body() dto: BaseSearchDto) {
    return this.vehicleService.searchCustomerVehicles(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: VehicleDto) {
    return this.vehicleService.createMine(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: VehicleDto) {
    return this.vehicleService.updateMine(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.deleteMine(user.id, id);
  }
}
