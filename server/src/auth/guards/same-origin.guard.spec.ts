import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SameOriginGuard } from './same-origin.guard';

function guardFor(allowDevOrigins: boolean) {
  const config = {
    get: () => ({
      allowedOrigins: ['https://omat.example.dz'],
      allowDevOrigins,
    }),
  } as unknown as ConfigService;
  return new SameOriginGuard(config);
}

function contextWith(origin?: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: { origin } }) }),
  } as never;
}

describe('SameOriginGuard', () => {
  it('allows requests without Origin and configured origins', () => {
    const guard = guardFor(false);
    expect(guard.canActivate(contextWith())).toBe(true);
    expect(guard.canActivate(contextWith('https://omat.example.dz'))).toBe(
      true,
    );
  });

  it('allows any origin outside production', () => {
    const guard = guardFor(true);
    for (const origin of [
      'http://localhost:3000',
      'http://192.168.124.68:3000',
      'https://d5e4-154-121-47-96.ngrok-free.app',
    ]) {
      expect(guard.canActivate(contextWith(origin))).toBe(true);
    }
  });

  it('refuses unlisted origins in production', () => {
    const guard = guardFor(false);
    for (const origin of [
      'https://abcd.ngrok-free.app',
      'http://localhost:3000',
      'http://192.168.124.68:3000',
    ]) {
      expect(() => guard.canActivate(contextWith(origin))).toThrow(
        ForbiddenException,
      );
    }
  });
});
