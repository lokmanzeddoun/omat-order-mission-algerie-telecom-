import { INestApplication } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PdfService } from 'src/pdf/pdf.service';
import { IS_PUBLIC_KEY } from 'src/auth/guards/public.decorator';

/**
 * Deny-by-default guardrail: the ONLY routes allowed to skip authentication are
 * the auth endpoints and the root status. Any new `@Public()` route anywhere
 * else makes this fail — a new hole can't be opened silently (ADR 0001).
 */
describe('Public-route metadata (e2e)', () => {
  let app: INestApplication;

  const ALLOWED_PUBLIC_CONTROLLERS = ['AppController', 'AuthController'];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DiscoveryModule],
    })
      .overrideProvider(PdfService)
      .useValue({
        renderOrdre: async () => Buffer.from(''),
        renderDecompte: async () => Buffer.from(''),
      })
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(() => app.close());

  it('only auth/status controllers expose public routes', () => {
    const discovery = app.get(DiscoveryService);
    const reflector = app.get(Reflector);
    const publicRoutes: string[] = [];

    for (const wrapper of discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;
      const proto = Object.getPrototypeOf(instance);
      const classPublic = reflector.get<boolean>(IS_PUBLIC_KEY, metatype);
      for (const method of Object.getOwnPropertyNames(proto)) {
        const handler = Object.getOwnPropertyDescriptor(proto, method)?.value;
        if (method === 'constructor' || typeof handler !== 'function') {
          continue;
        }
        const handlerPublic = reflector.get<boolean>(IS_PUBLIC_KEY, handler);
        if (classPublic || handlerPublic) {
          publicRoutes.push(`${metatype.name}.${method}`);
        }
      }
    }

    // Sanity: the login route really is public (so the test isn't vacuous).
    expect(publicRoutes).toContain('AuthController.login');
    // No public route outside the allow-listed controllers.
    const offenders = publicRoutes.filter(
      (r) => !ALLOWED_PUBLIC_CONTROLLERS.includes(r.split('.')[0]),
    );
    expect(offenders).toEqual([]);
  });
});
