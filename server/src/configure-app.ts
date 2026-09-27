import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type {
  CorsConfig,
  NestConfig,
  SwaggerConfig,
} from './common/configs/config.interface';

/** Request bodies are small JSON forms; uploads go through multer, not here. */
export const BODY_LIMIT = '100kb';

/**
 * Everything main.ts applies to the app besides logging and listen().
 * The e2e tests call it too, so they exercise the production pipeline.
 */
export function configureApp(app: INestApplication) {
  const expressApp = app as NestExpressApplication;
  const configService = app.get(ConfigService);
  const nestConfig = configService.get<NestConfig>('nest');
  const corsConfig = configService.get<CorsConfig>('cors');
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');

  // Behind nginx: take the client IP from X-Forwarded-For (rate limits, logs).
  expressApp.set('trust proxy', nestConfig.trustProxy);

  // Security headers. The API only serves JSON and files, so its CSP forbids
  // everything; Swagger UI (development only) needs inline scripts and styles.
  app.use(
    helmet({
      contentSecurityPolicy: swaggerConfig.enabled
        ? false
        : {
            useDefaults: false,
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'none'"],
              formAction: ["'none'"],
            },
          },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );

  expressApp.useBodyParser('json', { limit: BODY_LIMIT });
  expressApp.useBodyParser('urlencoded', { limit: BODY_LIMIT, extended: true });

  // Validation with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Return validation errors in a user-friendly format
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints;
          return constraints
            ? Object.values(constraints).join(', ')
            : 'Validation error';
        });
        return new BadRequestException(messages);
      },
    }),
  );

  // enable shutdown hook
  app.enableShutdownHooks();

  // Global exception filters. Nest tries global filters in REVERSE order of
  // registration, so the catch-all goes first and the most specific last:
  // Prisma errors, then HTTP exceptions, then everything else.
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(httpAdapter),
  );

  // Swagger Api
  if (swaggerConfig.enabled) {
    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'Nestjs')
      .setDescription(swaggerConfig.description || 'The nestjs API description')
      .setVersion(swaggerConfig.version || '1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup(swaggerConfig.path || 'api', app, document);
  }

  // Cors
  if (corsConfig.enabled) {
    app.enableCors({
      origin: corsConfig.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  }
  // Cookie parser (required to read httpOnly cookies)
  app.use(cookieParser());
}
