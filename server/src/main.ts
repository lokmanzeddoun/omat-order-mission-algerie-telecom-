import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { configureApp } from './configure-app';
import type { NestConfig } from './common/configs/config.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app);
  const nestConfig = app.get(ConfigService).get<NestConfig>('nest');
  await app.listen(nestConfig.port);
}
bootstrap();
