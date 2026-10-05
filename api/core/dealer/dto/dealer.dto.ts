import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OperatingDayDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @Matches(HH_MM)
  startTime: string;

  @Matches(HH_MM)
  endTime: string;

  @IsBoolean()
  isClose: boolean;
}

export class UpdateOperatingHourDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => OperatingDayDto)
  schedule: OperatingDayDto[];
}
