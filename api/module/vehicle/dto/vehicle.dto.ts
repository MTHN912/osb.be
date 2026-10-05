import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { normalizePlate } from '../../../shared/utils/sanitize.util';

export class VehicleDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizePlate(value) : value))
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  @IsString()
  @Length(17, 17)
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/)
  vin?: string;

  @Type(() => Number)
  @IsInt()
  vehicleModelId: number;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;
}
