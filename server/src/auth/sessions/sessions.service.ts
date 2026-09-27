import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { randomUUID } from 'crypto';
import type { AuthConfig } from 'src/common/configs/config.interface';
import { ROTATION_GRACE_MS } from '../auth.constants';
import { hmac, randomToken, sameDigest } from '../crypto.util';

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}

export interface IssuedSession {
  /** Cookie value: `<session id>.<secret>`. */
  token: string;
  expiresAt: Date;
  matricule: number;
}

/**
 * Refresh-token sessions (ADR 0002). The refresh token is opaque; the
 * database keeps only an HMAC of its secret, keyed with JWT_REFRESH_SECRET,
 * so a database leak does not yield usable tokens.
 */
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get key(): string {
    return this.config.get<string>('JWT_REFRESH_SECRET');
  }

  private get ttlMs(): number {
    return this.config.get<AuthConfig>('auth').refreshTtlMs;
  }

  /** Opens a new session (a new family unless one is given). */
  async open(
    matricule: number,
    meta: ClientMeta,
    familyId: string = randomUUID(),
  ): Promise<IssuedSession> {
    const secret = randomToken();
    const expiresAt = new Date(Date.now() + this.ttlMs);
    const session = await this.prisma.session.create({
      data: {
        userMatricule: matricule,
        familyId,
        tokenHash: hmac(this.key, secret),
        expiresAt,
        ip: meta.ip?.slice(0, 64),
        userAgent: meta.userAgent?.slice(0, 256),
      },
    });
    return { token: `${session.id}.${secret}`, expiresAt, matricule };
  }

  /**
   * Exchanges a refresh token for a new one. A token that was already
   * rotated (outside the grace window) or revoked is treated as stolen:
   * the whole family is revoked.
   */
  async rotate(token: string, meta: ClientMeta): Promise<IssuedSession> {
    const session = await this.find(token);
    const now = Date.now();

    if (session.revokedAt || session.expiresAt.getTime() <= now) {
      throw new UnauthorizedException('Session expirée');
    }
    if (session.rotatedAt) {
      if (now - session.rotatedAt.getTime() > ROTATION_GRACE_MS) {
        await this.revokeFamily(session.familyId);
        this.logger.warn(
          `Refresh token reuse detected for matricule ${session.userMatricule}; family revoked`,
        );
        throw new UnauthorizedException('Session expirée');
      }
      // Two tabs refreshing at once: let the late one join the family.
    }

    const user = await this.prisma.user.findUnique({
      where: { matricule: session.userMatricule },
      select: { soft_delete: true, passwordChangedAt: true },
    });
    if (
      !user ||
      user.soft_delete ||
      (user.passwordChangedAt && session.createdAt < user.passwordChangedAt)
    ) {
      await this.revokeFamily(session.familyId);
      throw new UnauthorizedException('Session expirée');
    }

    const next = await this.open(session.userMatricule, meta, session.familyId);
    await this.prisma.session.updateMany({
      where: { id: session.id, rotatedAt: null },
      data: { rotatedAt: new Date(now) },
    });
    return next;
  }

  /** Logout: ends the family the token belongs to. Unknown tokens are ignored. */
  async revoke(token: string | undefined): Promise<void> {
    if (!token) return;
    try {
      const session = await this.find(token);
      await this.revokeFamily(session.familyId);
    } catch {
      // Nothing to revoke.
    }
  }

  async revokeAllForUser(matricule: number): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userMatricule: matricule, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string) {
    await this.prisma.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async find(token: string) {
    const [id, secret] = String(token).split('.');
    if (!id || !secret || !/^[0-9a-f-]{36}$/.test(id)) {
      throw new UnauthorizedException('Session expirée');
    }
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session || !sameDigest(session.tokenHash, hmac(this.key, secret))) {
      throw new UnauthorizedException('Session expirée');
    }
    return session;
  }
}
