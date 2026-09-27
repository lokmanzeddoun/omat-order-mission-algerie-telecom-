import type { Params } from 'nestjs-pino';

/**
 * Credentials and personal data that must never reach the logs: the Bearer
 * token, the refresh cookie, and any password in a logged object.
 */
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  'currentPassword',
  '*.currentPassword',
  'newPassword',
  '*.newPassword',
  'token',
  '*.token',
  'refreshToken',
  '*.refreshToken',
];

export function pinoParams(): Params {
  const dev = (process.env.NODE_ENV ?? 'development') === 'development';
  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
      // Human-readable lines in development; structured JSON everywhere else.
      transport: dev
        ? { target: 'pino-pretty', options: { singleLine: true } }
        : undefined,
    },
  };
}
