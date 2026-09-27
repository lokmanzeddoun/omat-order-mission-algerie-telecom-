import { validateEnv } from './env.validation';

const SECRET_A = 'a'.repeat(32);
const SECRET_B = 'b'.repeat(32);
const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/omat',
  JWT_SECRET: SECRET_A,
  JWT_REFRESH_SECRET: SECRET_B,
};

describe('validateEnv', () => {
  it('accepts a complete development environment', () => {
    expect(() => validateEnv(valid)).not.toThrow();
  });

  it.each([
    ['a missing JWT_SECRET', { JWT_SECRET: undefined }, /JWT_SECRET/],
    ['a short JWT_SECRET', { JWT_SECRET: 'short' }, /JWT_SECRET/],
    [
      'a missing JWT_REFRESH_SECRET',
      { JWT_REFRESH_SECRET: undefined },
      /JWT_REFRESH_SECRET/,
    ],
    ['reused secrets', { JWT_REFRESH_SECRET: SECRET_A }, /differ/],
    ['a missing DATABASE_URL', { DATABASE_URL: undefined }, /DATABASE_URL/],
    ['an unknown NODE_ENV', { NODE_ENV: 'staging' }, /NODE_ENV/],
    ['a bad TRUST_PROXY', { TRUST_PROXY: 'yes please' }, /TRUST_PROXY/],
  ])('refuses %s', (_, override, message) => {
    expect(() => validateEnv({ ...valid, ...override })).toThrow(message);
  });

  it('requires APP_PUBLIC_URL in production', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'production' })).toThrow(
      /APP_PUBLIC_URL/,
    );
    expect(() =>
      validateEnv({
        ...valid,
        NODE_ENV: 'production',
        APP_PUBLIC_URL: 'https://omat.at.dz/omat',
      }),
    ).not.toThrow();
  });

  it('never prints the secret values', () => {
    try {
      validateEnv({ ...valid, JWT_SECRET: 'tiny-secret-value' });
    } catch (e) {
      expect(String(e)).not.toContain('tiny-secret-value');
    }
  });
});
