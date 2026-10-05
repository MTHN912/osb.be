import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { getEnvOrThrow } from '../../../shared/utils/env.util';
import { AuthUser } from '../../../shared/decorators/current-user.decorator';
import { CustomerJwtPayload } from '../interfaces/auth-customer.interface';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnvOrThrow<string>(config, 'JWT_CUSTOMER_SECRET'),
    });
  }

  validate(payload: CustomerJwtPayload): AuthUser {
    return {
      id: Number(payload.sub),
      email: payload.email,
      dealerId: Number(payload.dealerId),
      type: 'customer',
    };
  }
}
