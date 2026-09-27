import { validateEnv } from './env.validation';

const SECRET_A = 'a'.repeat(32);
const SECRET_B = 'b'.repeat(32);
const valid = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/omat',
  JWT_SECRET: SECRET_A,
  JWT_REFRESH_SECRET: SECRET_B,
  MFA_ENCRYPTION_KEY: 'c'.repeat(32),
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
    [
      'a missing MFA_ENCRYPTION_KEY',
      { MFA_ENCRYPTION_KEY: undefined },
      /MFA_ENCRYPTION_KEY/,
    ],
    [
      'an MFA key equal to the JWT secret',
      { MFA_ENCRYPTION_KEY: SECRET_A },
      /MFA_ENCRYPTION_KEY/,
    ],
    [
      'MFA turned off outside development',
      { NODE_ENV: 'test', AUTH_MFA_REQUIRED: 'false' },
      /AUTH_MFA_REQUIRED/,
    ],
    ['a year-long access token', { JWT_EXPIRES_IN: '365d' }, /JWT_EXPIRES_IN/],
  ])('refuses %s', (_, override, message) => {
    expect(() => validateEnv({ ...valid, ...override })).toThrow(message);
  });

  it('lets development turn MFA off', () => {
    expect(() =>
      validateEnv({ ...valid, AUTH_MFA_REQUIRED: 'false' }),
    ).not.toThrow();
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
