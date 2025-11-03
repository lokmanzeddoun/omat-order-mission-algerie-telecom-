import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP Exception Filter
 * Catches all HTTP exceptions and formats them consistently for the frontend
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const errorMessage = this.extractErrorMessage(exceptionResponse);

    // Log the error for debugging (sanitize sensitive info in production)
    this.logger.error(
      `HTTP ${status} Error: ${request.method} ${request.url} - ${errorMessage}`,
      exception.stack,
    );

    // Send a clean, consistent error response to the frontend
    response.status(status).json({
      statusCode: status,
      message: errorMessage,
      error: this.getErrorType(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Extract a user-friendly error message from the exception response
   */
  private extractErrorMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as any;

      // Handle validation errors (array of messages)
      if (Array.isArray(response.message)) {
        return response.message.join(', ');
      }

      // Handle single message
      if (response.message) {
        return response.message;
      }

      // Handle error property
      if (response.error) {
        return response.error;
      }
    }

    return 'Une erreur est survenue';
  }

  /**
   * Get a user-friendly error type based on status code
   */
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
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Erreur serveur';
      default:
        return 'Erreur';
    }
  }
}
