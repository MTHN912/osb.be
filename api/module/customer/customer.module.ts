import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { AuthCustomerModule } from '../../core/auth-customer/auth-customer.module';

@Module({
  imports: [AuthCustomerModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
