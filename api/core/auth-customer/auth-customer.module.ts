import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthCustomerService } from './auth-customer.service';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

@Module({
  imports: [PassportModule],
  providers: [AuthCustomerService, CustomerJwtStrategy],
  exports: [AuthCustomerService],
})
export class AuthCustomerModule {}
