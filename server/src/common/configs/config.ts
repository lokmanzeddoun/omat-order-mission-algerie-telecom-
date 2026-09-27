import type { Config } from './config.interface';

/** Parses Express `trust proxy`: "1" → 1, "false" → false, else the string. */
function trustProxy(raw: string | undefined): boolean | number | string {
  if (!raw || raw === 'false') return false;
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

// A factory, so the environment is read at boot (after validation), not at import.
export default (): Config => ({
  nest: {
    port: parseInt(process.env.PORT ?? '8000', 10),
    trustProxy: trustProxy(process.env.TRUST_PROXY),
  },
  cors: {
    enabled: true,
    origins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
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
});
