import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckEmailDto {
  @IsEmail()
  email: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

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
  suburb?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdminUpdateCustomerDto extends UpdateCustomerDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
