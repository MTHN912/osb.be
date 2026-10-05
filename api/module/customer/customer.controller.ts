import { Controller, Post, Get, Patch, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CheckEmailDto, UpdateCustomerDto, AdminUpdateCustomerDto } from './dto/customer.dto';
import { AuthCustomerService } from '../../core/auth-customer/auth-customer.service';
import {
  RegisterCustomerDto,
  LoginCustomerDto,
  RefreshCustomerDto,
  ForgotPasswordCustomerDto,
  ResetPasswordCustomerDto,
  ChangePasswordCustomerDto,
} from '../../core/auth-customer/dto/auth-customer.dto';
import { CustomerAuthGuard } from '../../core/auth-customer/guards/customer-auth.guard';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { BaseSearchDto } from '../../core/crud/dto/base-search.dto';
import { DealerId } from '../../shared/decorators/dealer-id.decorator';
import { CurrentUser, AuthUser } from '../../shared/decorators/current-user.decorator';

@Controller('customer')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly authCustomerService: AuthCustomerService,
  ) {}

  @Post()
  register(@Body() dto: RegisterCustomerDto, @DealerId() dealerId?: number) {
    return this.authCustomerService.register(dto, dealerId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginCustomerDto, @DealerId() dealerId?: number) {
    return this.authCustomerService.login(dto, dealerId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshCustomerDto) {
    return this.authCustomerService.refresh(dto.refreshToken);
  }

  @Get('profile')
  @UseGuards(CustomerAuthGuard)
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authCustomerService.getProfile(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerAuthGuard)
  logout(@CurrentUser() user: AuthUser) {
    return this.authCustomerService.logout(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordCustomerDto, @DealerId() dealerId?: number) {
    return this.authCustomerService.forgotPassword(dto.email, dealerId);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordCustomerDto) {
    return this.authCustomerService.resetPassword(dto);
  }

  @Patch('change-password')
  @UseGuards(CustomerAuthGuard)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordCustomerDto) {
    return this.authCustomerService.changePassword(user.id, dto);
  }

  @Patch('profile-update')
  @UseGuards(CustomerAuthGuard)
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateCustomerDto) {
    return this.customerService.updateCustomer(user.id, dto);
  }

  @Post('check-email-exist')
  @HttpCode(HttpStatus.OK)
  checkEmailExist(@Body() dto: CheckEmailDto, @DealerId() dealerId?: number) {
    return this.customerService.checkEmailExists(dto.email, dealerId);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  search(@Body() dto: BaseSearchDto, @DealerId() dealerId?: number) {
    return this.customerService.searchCustomers(dto, dealerId);
  }

  @Patch(':id/update')
  @UseGuards(JwtAuthGuard)
  updateCustomer(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateCustomerDto, @DealerId() dealerId?: number) {
    return this.customerService.updateCustomer(id, dto, dealerId);
  }
}
