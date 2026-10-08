import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { BookingAppointmentService } from './booking-appointment.service';
import { DealerId } from '../../shared/decorators/dealer-id.decorator';
import { TimeSlotsPeriodDto } from './dto/booking.dto';

@Controller('booking-appointment')
export class BookingAppointmentController {
  constructor(private readonly appointmentService: BookingAppointmentService) {}

  @Post('time-slots-period')
  @HttpCode(HttpStatus.OK)
  getTimeSlotsPeriod(@Body() dto: TimeSlotsPeriodDto, @DealerId() dealerId?: number) {
    return this.appointmentService.getTimeSlotsPeriod(dto, dealerId);
  }
}

