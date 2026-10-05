import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super({ statusCode, errorCode, message }, statusCode);
  }
}
