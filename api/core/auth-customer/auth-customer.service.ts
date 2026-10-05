import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtCoreService } from '../jwt/jwt.service';
import { MailService } from '../mail/mail.service';
import { MailDealer } from '../mail/interfaces/mail.interface';
import { hashPassword, comparePassword } from '../../shared/utils/hash.util';
import { sanitizeCustomer, stripSecrets } from '../../shared/utils/sanitize.util';
import { t } from '../../shared/utils/i18n.util';
import { RegisterCustomerDto, LoginCustomerDto, ResetPasswordCustomerDto, ChangePasswordCustomerDto } from './dto/auth-customer.dto';
import { CUSTOMER_PROFILE_INCLUDE } from './constants/auth-customer.constant';
import { CustomerJwtPayload, CustomerLoginResponse } from './interfaces/auth-customer.interface';

@Injectable()
export class AuthCustomerService extends CrudService {
  protected readonly modelName = 'Customer';
  private readonly logger = new Logger(AuthCustomerService.name);

  constructor(
    prisma: PrismaService,
    private readonly jwt: JwtCoreService,
    private readonly mail: MailService,
  ) {
    super(prisma);
  }

  async register(dto: RegisterCustomerDto, dealerId?: number) {
    const dealer = await this.requireDealer(dealerId);
    const existing = await this.findOne({ where: { email: dto.email }, dealerId: dealer.id });
    if (existing && !existing.isGuest) {
      throw new ConflictException(t('EMAIL_ALREADY_REGISTERED'));
    }

    const data = {
      email: dto.email,
      password: await hashPassword(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      isGuest: false,
    };

    const customer = existing
      ? await this.update({ where: { id: existing.id }, data })
      : await this.create({ data, dealerId: dealer.id });

    try {
      await this.mail.sendWelcome(customer.email, customer.firstName, dealer);
    } catch (error) {
      this.logger.error(t('WELCOME_MAIL_FAILED', { error: (error as Error).message }));
    }

    return { message: t('CUSTOMER_REGISTERED'), customer: stripSecrets(customer) };
  }

  async login(dto: LoginCustomerDto, dealerId?: number): Promise<CustomerLoginResponse> {
    const dealer = await this.requireDealer(dealerId);
    const customer = await this.findOne({ where: { email: dto.email }, dealerId: dealer.id });
    if (!customer?.password || !(await comparePassword(dto.password, customer.password))) {
      throw new UnauthorizedException(t('INVALID_CREDENTIALS'));
    }
    if (!customer.isActive) {
      throw new UnauthorizedException(t('ACCOUNT_DEACTIVATED'));
    }

    const payload: CustomerJwtPayload = { sub: customer.id, email: customer.email, dealerId: customer.dealerId };
    const accessToken = this.jwt.sign('customer', { ...payload });
    const refreshToken = this.jwt.sign('customerRefresh', { sub: customer.id });

    await this.update({ where: { id: customer.id }, data: { currentRefreshToken: await hashPassword(refreshToken) } });

    return { access_token: accessToken, refresh_token: refreshToken, customer: stripSecrets(customer) };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    let customerId: number;
    try {
      customerId = Number(this.jwt.verify<{ sub: number }>('customerRefresh', refreshToken).sub);
    } catch {
      throw new UnauthorizedException(t('INVALID_REFRESH_TOKEN'));
    }

    const customer = await this.findOne({ where: { id: customerId } });
    const isValid = customer?.currentRefreshToken && (await comparePassword(refreshToken, customer.currentRefreshToken));
    if (!customer || !isValid || !customer.isActive) {
      throw new UnauthorizedException(t('INVALID_REFRESH_TOKEN'));
    }

    const payload: CustomerJwtPayload = { sub: customer.id, email: customer.email, dealerId: customer.dealerId };
    return { access_token: this.jwt.sign('customer', { ...payload }) };
  }

  async logout(customerId: number): Promise<{ message: string }> {
    await this.update({ where: { id: customerId }, data: { currentRefreshToken: null } });
    return { message: t('LOGOUT_SUCCESS') };
  }

  async forgotPassword(email: string, dealerId?: number): Promise<{ message: string }> {
    const dealer = await this.requireDealer(dealerId);
    const customer = await this.findOne({ where: { email, isGuest: false }, dealerId: dealer.id });

    if (customer) {
      const token = await this.issueResetToken(customer.id);
      try {
        await this.mail.sendPasswordReset(customer.email, customer.firstName, token, dealer);
      } catch (error) {
        this.logger.error(t('PASSWORD_RESET_MAIL_FAILED', { error: (error as Error).message }));
      }
    }

    return { message: t('FORGOT_PASSWORD_EMAIL_SENT') };
  }

  async sendWelcomeWithSetPassword(customer: { id: number; email: string; firstName: string }, dealer: MailDealer): Promise<void> {
    try {
      const token = await this.issueResetToken(customer.id);
      await this.mail.sendWelcomeWithSetPassword(customer.email, customer.firstName, token, dealer);
    } catch (error) {
      this.logger.error(t('WELCOME_MAIL_FAILED', { error: (error as Error).message }));
    }
  }

  async resetPassword(dto: ResetPasswordCustomerDto): Promise<{ message: string }> {
    let customerId: number;
    try {
      customerId = Number(this.jwt.verify<{ sub: number }>('resetPassword', dto.token).sub);
    } catch {
      throw new BadRequestException(t('INVALID_RESET_TOKEN'));
    }

    const customer = await this.findOne({ where: { id: customerId } });
    const isValid = customer?.currentResetToken && (await comparePassword(dto.token, customer.currentResetToken));
    if (!customer || !isValid) {
      throw new BadRequestException(t('INVALID_RESET_TOKEN'));
    }

    await this.update({
      where: { id: customer.id },
      data: { password: await hashPassword(dto.newPassword), isGuest: false, currentResetToken: null, currentRefreshToken: null },
    });
    return { message: t('RESET_PASSWORD_SUCCESS') };
  }

  async changePassword(customerId: number, dto: ChangePasswordCustomerDto): Promise<{ message: string }> {
    const customer = await this.findOne({ where: { id: customerId }, throwError: true });
    if (!customer.password || !(await comparePassword(dto.currentPassword, customer.password))) {
      throw new BadRequestException(t('CURRENT_PASSWORD_INCORRECT'));
    }

    await this.update({ where: { id: customerId }, data: { password: await hashPassword(dto.newPassword) } });
    return { message: t('PASSWORD_CHANGED') };
  }

  async getProfile(customerId: number) {
    const customer = await this.findOne({
      where: { id: customerId },
      include: CUSTOMER_PROFILE_INCLUDE,
      throwError: true,
    });
    return sanitizeCustomer(customer);
  }

  private async issueResetToken(customerId: number): Promise<string> {
    const token = this.jwt.sign('resetPassword', { sub: customerId });
    await this.update({ where: { id: customerId }, data: { currentResetToken: await hashPassword(token) } });
    return token;
  }

  private async requireDealer(dealerId?: number) {
    if (!dealerId) {
      throw new BadRequestException(t('DEALER_ID_REQUIRED'));
    }
    return this.findOne({ model: 'Dealer', where: { id: dealerId, active: true }, throwError: true });
  }
}
