import { Role } from '@prisma/client';

/** Claims of an access token (issuer, audience, iat and exp are added by JwtService). */
export interface AccessPayload {
  matricule: number;
  role: Role;
  typ: 'access';
  iat?: number;
}

/** @deprecated kept for existing imports; use AccessPayload. */
export type JwtPayload = AccessPayload;

export type MfaStage = 'enroll' | 'verify';

/** A 5-minute token between the password step and the MFA step. */
export interface MfaPayload {
  matricule: number;
  stage: MfaStage;
  typ: 'mfa';
}
