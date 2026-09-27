import { Test } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Provider,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export const TEST_ACTOR = 42;

/** Stands in for the JWT guard: the role comes from an `x-role` header. */
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      matricule: TEST_ACTOR,
      nom: 'Test',
      role: req.headers['x-role'],
    };
    return true;
  }
}

/**
 * Boots one controller over HTTP with the real RolesGuard and the app's
 * ValidationPipe settings, but no database and no real JWT.
 */
export async function createHttpApp(
  controller: Type<unknown>,
  providers: Provider[],
): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    controllers: [controller],
    providers,
  })
    .overrideGuard(AuthGuard('jwt'))
    .useClass(FakeJwtGuard)
    .compile();
  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}
