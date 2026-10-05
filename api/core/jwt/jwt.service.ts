import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getEnvOrThrow } from '../../shared/utils/env.util';

export type TokenKind = 'admin' | 'adminRefresh' | 'customer' | 'customerRefresh' | 'resetPassword';

const TOKEN_ENV: Record<TokenKind, { secret: string; expiresIn: string }> = {
  admin: { secret: 'JWT_SECRET', expiresIn: 'JWT_EXPIRATION' },
  adminRefresh: { secret: 'JWT_REFRESH_SECRET', expiresIn: 'JWT_REFRESH_EXPIRATION' },
  customer: { secret: 'JWT_CUSTOMER_SECRET', expiresIn: 'JWT_CUSTOMER_EXPIRATION' },
  customerRefresh: { secret: 'JWT_CUSTOMER_REFRESH_SECRET', expiresIn: 'JWT_CUSTOMER_REFRESH_EXPIRATION' },
  resetPassword: { secret: 'JWT_RESET_PASSWORD_SECRET', expiresIn: 'JWT_RESET_PASSWORD_EXPIRATION' },
};

@Injectable()
export class JwtCoreService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  sign(kind: TokenKind, payload: Record<string, unknown>): string {
    const env = TOKEN_ENV[kind];
    return this.jwtService.sign(payload, {
      secret: getEnvOrThrow<string>(this.config, env.secret),
      expiresIn: getEnvOrThrow<string>(this.config, env.expiresIn),
    });
  }

  verify<T extends object = Record<string, any>>(kind: TokenKind, token: string): T {
    return this.jwtService.verify<T>(token, {
      secret: getEnvOrThrow<string>(this.config, TOKEN_ENV[kind].secret),
    });
  }
}
