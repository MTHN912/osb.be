import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingAppointmentController } from './booking-appointment.controller';
import { BookingService } from './booking.service';
import { BookingAppointmentService } from './booking-appointment.service';
import { UserModule } from '../../core/user/user.module';
import { AuthCustomerModule } from '../../core/auth-customer/auth-customer.module';
import { VehicleModule } from '../vehicle/vehicle.module';

@Module({
  imports: [UserModule, AuthCustomerModule, VehicleModule],
  controllers: [BookingController, BookingAppointmentController],
  providers: [BookingService, BookingAppointmentService],
  exports: [BookingService, BookingAppointmentService],
})
export class BookingModule {}
