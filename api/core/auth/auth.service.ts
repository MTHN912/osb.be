import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CrudService } from '../crud/crud.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtCoreService } from '../jwt/jwt.service';
import { hashPassword, comparePassword } from '../../shared/utils/hash.util';
import { stripSecrets } from '../../shared/utils/sanitize.util';
import { t } from '../../shared/utils/i18n.util';
import { USER_AUTH_INCLUDE } from './constants/auth.constant';
import { AdminJwtPayload, AdminLoginResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService extends CrudService {
  protected readonly modelName = 'User';

  constructor(
    prisma: PrismaService,
    private readonly jwt: JwtCoreService,
  ) {
    super(prisma);
  }

  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const user = await this.findOne({ where: { email }, include: USER_AUTH_INCLUDE });
    if (!user?.password || !(await comparePassword(password, user.password))) {
      throw new UnauthorizedException(t('INVALID_CREDENTIALS'));
    }
    if (!user.isActive) {
      throw new UnauthorizedException(t('ACCOUNT_DEACTIVATED'));
    }

    const roles: string[] = user.roles.map((r: { role: { code: string } }) => r.role.code);
    const payload: AdminJwtPayload = { sub: user.id, email: user.email, roles, dealerId: user.dealerId };
    const accessToken = this.jwt.sign('admin', { ...payload });
    const refreshToken = this.jwt.sign('adminRefresh', { sub: user.id });

    await this.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), currentRefreshToken: await hashPassword(refreshToken) },
    });

    const { roles: _roleLinks, ...profile } = stripSecrets(user);
    return { access_token: accessToken, refresh_token: refreshToken, user: { ...profile, roles } };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    let userId: number;
    try {
      userId = Number(this.jwt.verify<{ sub: number }>('adminRefresh', refreshToken).sub);
    } catch {
      throw new UnauthorizedException(t('INVALID_REFRESH_TOKEN'));
    }

    const user = await this.findOne({ where: { id: userId }, include: USER_AUTH_INCLUDE });
    const isValid = user?.currentRefreshToken && (await comparePassword(refreshToken, user.currentRefreshToken));
    if (!user || !isValid || !user.isActive) {
      throw new UnauthorizedException(t('INVALID_REFRESH_TOKEN'));
    }

    const roles: string[] = user.roles.map((r: { role: { code: string } }) => r.role.code);
    return { access_token: this.jwt.sign('admin', { sub: user.id, email: user.email, roles, dealerId: user.dealerId }) };
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.update({ where: { id: userId }, data: { currentRefreshToken: null } });
    return { message: t('LOGOUT_SUCCESS') };
  }
}
