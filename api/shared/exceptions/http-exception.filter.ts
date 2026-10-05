import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { t } from '../utils/i18n.util';

const STATUS_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message: string | string[] = t('INTERNAL_ERROR');

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorCode = STATUS_ERROR_CODES[statusCode] ?? errorCode;
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const resp = body as Record<string, any>;
        message = resp.message ?? exception.message;
        errorCode = resp.errorCode ?? errorCode;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      errorCode = 'CONFLICT';
      const target = exception.meta?.target;
      message = t('UNIQUE_CONSTRAINT_FAILED', { fields: Array.isArray(target) ? target.join(', ') : String(target) });
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2025') {
      statusCode = HttpStatus.NOT_FOUND;
      errorCode = 'NOT_FOUND';
      message = t('RECORD_NOT_FOUND');
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(statusCode).json({
      statusCode,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
