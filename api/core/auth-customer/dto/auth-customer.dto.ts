import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
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

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

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

export class LoginCustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshCustomerDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordCustomerDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordCustomerDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordCustomerDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
