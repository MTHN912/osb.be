import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CustomerAuthGuard } from '../../core/auth-customer/guards/customer-auth.guard';
import { BaseSearchDto } from '../../core/crud/dto/base-search.dto';
import { DealerId } from '../../shared/decorators/dealer-id.decorator';
import { AuthUser, CurrentUser } from '../../shared/decorators/current-user.decorator';
import {
  AdminBookingDto,
  BaseBookingDto,
  GuestBookingDto,
  LookupBookingDto,
  RescheduleLookupDto,
  UpdateAppointmentDto,
  UpdateServiceDto,
  UpdateStatusDto,
} from './dto/booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(CustomerAuthGuard)
  create(@Body() dto: BaseBookingDto, @CurrentUser() user: AuthUser, @DealerId() dealerId?: number) {
    return this.bookingService.processBooking(dto, dealerId, 'customer', user);
  }

  @Post('guest')
  createGuest(@Body() dto: GuestBookingDto, @DealerId() dealerId?: number) {
    return this.bookingService.processBooking(dto, dealerId, 'guest');
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  createAdmin(@Body() dto: AdminBookingDto, @DealerId() dealerId?: number) {
    return this.bookingService.processBooking(dto, dealerId, 'admin');
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  search(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.bookingService.searchBookings(dto, dealerId);
  }

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  lookup(@Body() dto: LookupBookingDto) {
    return this.bookingService.lookup(dto);
  }

  @Patch('lookup/cancel')
  cancelByLookup(@Body() dto: LookupBookingDto) {
    return this.bookingService.cancelByLookup(dto);
  }

  @Patch('lookup/reschedule')
  rescheduleByLookup(@Body() dto: RescheduleLookupDto) {
    return this.bookingService.rescheduleByLookup(dto);
  }

  @Patch(':id/cancelled')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id', ParseIntPipe) id: number, @DealerId() dealerId?: number) {
    return this.bookingService.cancelBooking(id, dealerId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto, @DealerId() dealerId?: number) {
    return this.bookingService.updateStatus(id, dto.status, dealerId);
  }

  @Patch(':id/completed')
  @UseGuards(JwtAuthGuard)
  complete(@Param('id', ParseIntPipe) id: number, @DealerId() dealerId?: number) {
    return this.bookingService.completeBooking(id, dealerId);
  }

  @Patch(':id/update-service')
  @UseGuards(JwtAuthGuard)
  updateService(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto, @DealerId() dealerId?: number) {
    return this.bookingService.updateServices(id, dto, dealerId);
  }

  @Patch(':id/update-appointment')
  @UseGuards(JwtAuthGuard)
  updateAppointment(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto, @DealerId() dealerId?: number) {
    return this.bookingService.updateAppointment(id, dto, dealerId);
  }
}
