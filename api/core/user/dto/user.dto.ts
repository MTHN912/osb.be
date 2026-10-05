import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Type(() => Number)
  @IsInt()
  roleId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dealerId?: number;
}

export class CreateTechnicianDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}
