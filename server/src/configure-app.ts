import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type {
  CorsConfig,
  SwaggerConfig,
} from './common/configs/config.interface';

/**
 * Everything main.ts applies to the app besides logging and listen().
 * The e2e tests call it too, so they exercise the production pipeline.
 */
export function configureApp(app: INestApplication) {
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

  // Global Exception Filters (order matters - specific to general)
  const { httpAdapter } = app.get(HttpAdapterHost);

  // 1. Prisma-specific errors
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  // 2. HTTP exceptions
  app.useGlobalFilters(new HttpExceptionFilter());

  // 3. Catch-all for any unhandled exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  const corsConfig = configService.get<CorsConfig>('cors');
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');

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
