import { Test } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  Provider,
  Type,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/guards/public.decorator';
import { RolesGuard } from 'src/roles/roles.guard';

export const TEST_ACTOR = 42;

/**
 * Stands in for the global JWT guard: the role comes from an `x-role` header,
 * and a request without one is anonymous (401), unless the route is @Public().
 */
@Injectable()
class FakeJwtGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest();
    const role = req.headers['x-role'];
    if (!role) throw new UnauthorizedException();
    req.user = { matricule: TEST_ACTOR, nom: 'Test', role };
    return true;
  }
}

/**
 * Boots one controller over HTTP with the same global guard chain as
 * AppModule (JWT, then the real RolesGuard) and the app's ValidationPipe
 * settings, but no database and no real JWT.
 */
export async function createHttpApp(
  controller: Type<unknown>,
  providers: Provider[],
): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    controllers: [controller],
    providers: [
      ...providers,
      { provide: APP_GUARD, useClass: FakeJwtGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
  }).compile();
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
