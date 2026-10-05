import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: number;
  email?: string | null;
  roles?: string[];
  dealerId?: number;
  type?: 'customer';
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
