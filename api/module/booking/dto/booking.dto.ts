import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';
import { VehicleDto } from '../../vehicle/dto/vehicle.dto';
import { LOOKUP_MIN_IDENTIFIER_LENGTH } from '../../../shared/constants/booking.constant';

export class PackageServiceDto {
  @Type(() => Number)
  @IsInt()
  serviceId: number;

  @IsString()
  @IsNotEmpty()
  serviceCode: string;
}

export class PackageDto {
  @Type(() => Number)
  @IsInt()
  packageId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageServiceDto)
  services: PackageServiceDto[];
}

export class AppointmentDto {
  @IsString()
  @IsNotEmpty()
  bookingDate: string;

  @IsString()
  @IsNotEmpty()
  bookingTime: string;
}

export class BaseBookingDto extends AppointmentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages: PackageDto[];

  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle: VehicleDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  technicianId?: number;

  @IsOptional()
  @IsBoolean()
  needMobility?: boolean;

  @IsOptional()
  @IsString()
  serviceNote?: string;

  @IsOptional()
  @IsString()
  technicianNote?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}

export class GuestBookingDto extends BaseBookingDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class AdminBookingDto extends BaseBookingDto {
  @IsEmail()
  customerEmail: string;
}

export class UpdateStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

export class UpdateServiceDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  serviceIds: number[];
}

export class UpdateAppointmentDto extends AppointmentDto {}

export class LookupBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookingId: number;

  @IsString()
  @MinLength(LOOKUP_MIN_IDENTIFIER_LENGTH)
  identifier: string;
}

export class RescheduleLookupDto extends LookupBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingDate: string;

  @IsString()
  @IsNotEmpty()
  bookingTime: string;
}

export class ServiceCodesDto {
  @IsArray()
  @IsString({ each: true })
  serviceCodes: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleModelId?: number;
}

export class TimeSlotsPeriodDto extends ServiceCodesDto {
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;
}

export class AvailableTechniciansDto extends ServiceCodesDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;
}
