/** JWT claims shared by the issuer (AuthService) and the verifier (JwtStrategy). */
export const JWT_ISSUER = 'omat-api';
export const ACCESS_AUDIENCE = 'omat-web';
export const MFA_AUDIENCE = 'omat-mfa';
export const JWT_ALGORITHM = 'HS256' as const;

export const REFRESH_COOKIE = 'refresh_token';

/** Consecutive failures before an account is locked, and the longest lock. */
export const LOCK_AFTER_FAILURES = 5;
export const MAX_LOCK_MINUTES = 60;

/** A rotated refresh token presented again within this window is a benign
 * race (two tabs refreshing at once), not a theft. */
export const ROTATION_GRACE_MS = 30_000;
