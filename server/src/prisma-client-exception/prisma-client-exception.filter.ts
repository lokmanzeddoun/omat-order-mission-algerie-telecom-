import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

/**
 * Prisma Client Exception Filter
 * Handles Prisma-specific errors and converts them to user-friendly messages
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error for debugging
    this.logger.error(
      `Prisma Error ${exception.code}: ${request.method} ${request.url}`,
      JSON.stringify(exception.meta ?? {}),
    );

    let status: HttpStatus;
    let message: string;

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation. The column names stay in the server
        // log: they reveal the schema and which values already exist.
        status = HttpStatus.CONFLICT;
        message = 'Cet enregistrement existe déjà';
        break;
      }
      case 'P2025': {
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = "L'enregistrement demandé n'existe pas";
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        message =
          'Impossible de supprimer cet enregistrement car il est référencé ailleurs';
        break;
      }
      case 'P2014': {
        // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Une relation requise est manquante';
        break;
      }
      default: {
        // For unknown Prisma errors, return a generic message
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Une erreur de base de données est survenue';
        break;
      }
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: this.getErrorType(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorType(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Requête invalide';
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
