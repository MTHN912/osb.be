import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getEnvOrThrow } from '../../../shared/utils/env.util';
import { AuthUser } from '../../../shared/decorators/current-user.decorator';
import { AdminJwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnvOrThrow<string>(config, 'JWT_SECRET'),
    });
  }

  validate(payload: AdminJwtPayload): AuthUser {
    return {
      id: Number(payload.sub),
      email: payload.email,
      roles: payload.roles ?? [],
      dealerId: payload.dealerId ?? undefined,
    };
  }
}
