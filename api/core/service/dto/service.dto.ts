import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceKind } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  packageCode: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ServiceKind)
  kind?: ServiceKind;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsBoolean()
  sizeSensitive?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  durationUnit?: string;

  @IsOptional()
  @IsBoolean()
  sizeSensitive?: boolean;
}

export class UpdateServiceIsActiveDto {
  @IsBoolean()
  isActive: boolean;
}

export class AddServiceToPackageDto {
  @Type(() => Number)
  @IsInt()
  packageId: number;

  @Type(() => Number)
  @IsInt()
  serviceId: number;
}
