import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** A client error raised by Express middleware (e.g. body-parser). */
function isClientError(
  exception: unknown,
): exception is { status: number; expose: true } {
  const e = exception as { status?: unknown; expose?: unknown } | null;
  return (
    typeof e?.status === 'number' &&
    e.status >= 400 &&
    e.status < 500 &&
    e.expose === true
  );
}

/**
 * Global Exception Filter
 * Catches all unhandled exceptions and returns a consistent error response
 * This prevents internal error details from leaking to the frontend
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur interne est survenue';

    // If it's an HTTP exception, extract status and message
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = this.extractMessage(exceptionResponse);
    } else if (isClientError(exception)) {
      // body-parser rejects oversized or malformed bodies before any route
      // runs; it marks those errors as safe to report (`expose`).
      status = exception.status;
      message =
        status === HttpStatus.PAYLOAD_TOO_LARGE
          ? 'Requête trop volumineuse'
          : 'Requête invalide';
    } else if (exception instanceof Error) {
      // Log the full error for debugging but don't expose it to the client
      this.logger.error(
        `Unhandled Error: ${exception.message}`,
        exception.stack,
      );
      message = 'Une erreur est survenue lors du traitement de votre requête';
    } else {
      // Unknown error type
      this.logger.error('Unknown error type', exception);
    }

    // Send clean error response
    response.status(status).json({
      statusCode: status,
      message: message,
      error: this.getErrorType(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private extractMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as any;
      if (Array.isArray(response.message)) {
        return response.message.join(', ');
      }
      if (response.message) {
        return response.message;
      }
      if (response.error) {
        return response.error;
      }
    }

    return 'Une erreur est survenue';
  }

  private getErrorType(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Requête invalide';
      case HttpStatus.UNAUTHORIZED:
        return 'Non autorisé';
      case HttpStatus.FORBIDDEN:
        return 'Accès interdit';
      case HttpStatus.NOT_FOUND:
        return 'Ressource introuvable';
      case HttpStatus.CONFLICT:
        return 'Conflit';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'Requête trop volumineuse';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Erreur serveur';
      default:
        return 'Erreur';
    }
  }
}
