import { Controller, Post, Patch, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DealerService } from './dealer.service';
import { UpdateOperatingHourDto } from './dto/dealer.dto';
import { BaseSearchDto } from '../crud/dto/base-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dealers')
export class DealerController {
  constructor(private readonly dealerService: DealerService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body() dto: BaseSearchDto) {
    return this.dealerService.searchDealers(dto);
  }

  @Post(':dealerId/public')
  @HttpCode(HttpStatus.OK)
  getPublic(@Param('dealerId', ParseIntPipe) dealerId: number, @Body() dto: BaseSearchDto) {
    return this.dealerService.getDealerPublic(dealerId, dto);
  }

  @Patch(':dealerId/edit-operating-hour')
  @UseGuards(JwtAuthGuard)
  editOperatingHour(@Param('dealerId', ParseIntPipe) dealerId: number, @Body() dto: UpdateOperatingHourDto) {
    return this.dealerService.editOperatingHour(dealerId, dto);
  }
}
