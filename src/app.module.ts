import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../api/core/prisma/prisma.module';
import { RedisModule } from '../api/core/redis/redis.module';
import { CrudModule } from '../api/core/crud/crud.module';
import { JwtCoreModule } from '../api/core/jwt/jwt.module';
import { MailModule } from '../api/core/mail/mail.module';
import { AuthModule } from '../api/core/auth/auth.module';
import { AuthCustomerModule } from '../api/core/auth-customer/auth-customer.module';
import { UserModule } from '../api/core/user/user.module';
import { DealerModule } from '../api/core/dealer/dealer.module';
import { PackageModule } from '../api/core/package/package.module';
import { ServiceModule } from '../api/core/service/service.module';
import { VehicleCatalogModule } from '../api/core/vehicle-catalog/vehicle-catalog.module';
import { CustomerModule } from '../api/module/customer/customer.module';
import { VehicleModule } from '../api/module/vehicle/vehicle.module';
import { BookingModule } from '../api/module/booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    RedisModule,
    CrudModule,
    JwtCoreModule,
    MailModule,
    AuthModule,
    AuthCustomerModule,
    UserModule,
    DealerModule,
    PackageModule,
    ServiceModule,
    VehicleCatalogModule,
    CustomerModule,
    VehicleModule,
    BookingModule,
  ],
})
export class AppModule {}
