import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DealerId = createParamDecorator((_data: unknown, ctx: ExecutionContext): number | undefined => {
  const request = ctx.switchToHttp().getRequest();
  const raw = request.headers['x-dealer-id'];
  if (!raw) return undefined;
  const parsed = parseInt(String(raw), 10);
  return isNaN(parsed) ? undefined : parsed;
});
