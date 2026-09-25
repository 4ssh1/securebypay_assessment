import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorCode } from '../constants/error-codes';
import { AppException } from '../exceptions/app.exception';

interface NormalizedError {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
};

const codeForStatus = (status: number): ErrorCode =>
  CODE_BY_STATUS[status] ?? (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST);

const isHttpErrorLike = (e: unknown): e is { status: number; expose: boolean; message: string } =>
  typeof e === 'object' &&
  e !== null &&
  typeof (e as { status?: unknown }).status === 'number' &&
  (e as { expose?: unknown }).expose === true;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const error = this.normalize(exception);

    const line = `[${req.requestId}] ${req.method} ${req.path} -> ${error.status} ${error.code}`;
    if (error.status >= 500) {
      this.logger.error(line, exception instanceof Error ? exception.stack : String(exception));
    } else {
      this.logger.warn(line);
    }

    const retryAfter = (error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
    if (error.status === HttpStatus.TOO_MANY_REQUESTS && retryAfter && !res.getHeader('Retry-After')) {
      res.setHeader('Retry-After', String(retryAfter));
    }

    res.status(error.status).json({
      success: false,
      error: {
        statusCode: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const rawMessage = typeof body === 'object' ? (body as { message?: unknown }).message : body;

      if (Array.isArray(rawMessage)) {
        return {
          status,
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Request validation failed',
          details: rawMessage,
        };
      }
      return {
        status,
        code: codeForStatus(status),
        message: typeof rawMessage === 'string' ? rawMessage : exception.message,
      };
    }

    if (isHttpErrorLike(exception)) {
      return { status: exception.status, code: codeForStatus(exception.status), message: exception.message };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    };
  }
}
