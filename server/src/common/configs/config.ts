import type { Config } from './config.interface';

/** Parses Express `trust proxy`: "1" → 1, "false" → false, else the string. */
function trustProxy(raw: string | undefined): boolean | number | string {
  if (!raw || raw === 'false') return false;
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

function originOf(url: string | undefined): string[] {
  if (!url) return [];
  try {
    return [new URL(url).origin];
  } catch {
    return [];
  }
}

// A factory, so the environment is read at boot (after validation), not at import.
export default (): Config => {
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const env = process.env.NODE_ENV ?? 'development';
  return {
    nest: {
      port: parseInt(process.env.PORT ?? '8000', 10),
      trustProxy: trustProxy(process.env.TRUST_PROXY),
    },
    cors: {
      enabled: true,
      origins: corsOrigins,
    },
    swagger: {
      enabled: process.env.NODE_ENV !== 'production',
      title: 'OMAT API',
      description: 'The OMAT API For Order Mission',
      version: '1.0',
      path: 'docs',
    },
    security: {
      expiresIn: '60m',
      refreshIn: '7d',
      bcryptSaltOrRound: 10,
    },
    auth: {
      accessTtl: process.env.JWT_EXPIRES_IN || '15m',
      refreshTtlMs: 7 * 24 * 60 * 60 * 1000,
      refreshCookiePath: '/api/auth',
      secureCookies: env === 'production',
      mfaRequired: process.env.AUTH_MFA_REQUIRED !== 'false',
      allowedOrigins: [...originOf(process.env.APP_PUBLIC_URL), ...corsOrigins],
      allowLocalhostOrigins: env !== 'production',
    },
  };
};
