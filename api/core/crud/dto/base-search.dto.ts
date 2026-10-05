import { IsOptional, IsObject, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsObject()
  where?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  select?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  include?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  orderBy?: Record<string, unknown>;
}
