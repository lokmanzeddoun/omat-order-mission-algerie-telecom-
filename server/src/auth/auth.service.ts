import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import * as bcrypt from 'bcryptjs';
import type { AuthConfig } from 'src/common/configs/config.interface';
import {
  LOCK_AFTER_FAILURES,
  MAX_LOCK_MINUTES,
  MFA_AUDIENCE,
} from './auth.constants';
import { randomToken } from './crypto.util';
import { AccessPayload, MfaPayload, MfaStage } from './interfaces';
import { MfaService, Enrollment } from './mfa/mfa.service';
import {
  ClientMeta,
  IssuedSession,
  SessionsService,
} from './sessions/sessions.service';

/** One message for every login failure: no hint whether the email exists. */
export const INVALID_CREDENTIALS = 'Identifiants invalides';

/** Roles that must pass the second factor (ADR 0002). */
const MFA_ROLES: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

export const PUBLIC_USER_SELECT = {
  matricule: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  grade: true,
  category: true,
  serviceId: true,
  status: true,
  createdAt: true,
} as const;

export interface SessionOutcome {
  kind: 'session';
  user: Record<string, unknown>;
  accessToken: string;
  refresh: IssuedSession;
  /** Only right after MFA enrollment: shown once. */
  recoveryCodes?: string[];
}

export interface MfaOutcome {
  kind: 'mfa';
  stage: MfaStage;
  mfaToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Compared against when the email is unknown, so timing does not tell. */
  private readonly dummyHash = bcrypt.hashSync(randomToken(), 10);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: SessionsService,
    private readonly mfa: MfaService,
  ) {}

  private get authConfig(): AuthConfig {
    return this.config.get<AuthConfig>('auth');
  }

  async login(
    email: string,
    password: string,
    meta: ClientMeta,
  ): Promise<SessionOutcome | MfaOutcome> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        matricule: true,
        role: true,
        status: true,
        password: true,
        soft_delete: true,
        lockedUntil: true,
        failedLoginCount: true,
        mfaEnabledAt: true,
      },
    });
    const passwordMatches = await bcrypt.compare(
      password,
      user?.password ?? this.dummyHash,
    );

    if (!user || user.soft_delete) {
      this.logger.warn('Login failed: unknown or archived account');
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      this.logger.warn(`Login refused: matricule ${user.matricule} is locked`);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!passwordMatches) {
      await this.registerFailure(user.matricule, user.failedLoginCount);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.prisma.user.update({
      where: { matricule: user.matricule },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        // INACTIVE means "never signed in": the first sign-in activates.
        ...(user.status === 'INACTIVE' ? { status: 'ACTIVE' } : {}),
      },
    });

    if (this.authConfig.mfaRequired && MFA_ROLES.includes(user.role)) {
      const stage: MfaStage = user.mfaEnabledAt ? 'verify' : 'enroll';
      return {
        kind: 'mfa',
        stage,
        mfaToken: this.signMfaToken(user.matricule, stage),
      };
    }
    this.logger.log(`Login: matricule ${user.matricule}`);
    return this.openSession(user.matricule, meta);
  }

  /** Enrollment step 1: a new TOTP secret for an admin without MFA. */
  async startMfaEnrollment(mfaToken: string): Promise<Enrollment> {
    const { matricule } = await this.readMfaToken(mfaToken, 'enroll');
    return this.mfa.startEnrollment(matricule);
  }

  /** Enrollment step 2 or a regular MFA login: checks the code, opens the session. */
  async completeMfa(
    mfaToken: string,
    code: string,
    meta: ClientMeta,
  ): Promise<SessionOutcome> {
    const { matricule, stage } = await this.readMfaToken(mfaToken);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { matricule },
      select: { failedLoginCount: true, lockedUntil: true },
    });
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    let recoveryCodes: string[] | undefined;
    if (stage === 'enroll') {
      recoveryCodes =
        (await this.mfa.confirmEnrollment(matricule, code)) ?? undefined;
      if (!recoveryCodes) {
        await this.registerFailure(matricule, user.failedLoginCount);
        throw new UnauthorizedException('Code invalide');
      }
    } else if (!(await this.mfa.verify(matricule, code))) {
      await this.registerFailure(matricule, user.failedLoginCount);
      throw new UnauthorizedException('Code invalide');
    }

    await this.prisma.user.update({
      where: { matricule },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
    this.logger.log(`Login with MFA: matricule ${matricule}`);
    const outcome = await this.openSession(matricule, meta);
    return { ...outcome, recoveryCodes };
  }

  async refresh(
    token: string | undefined,
    meta: ClientMeta,
  ): Promise<SessionOutcome> {
    if (!token) throw new UnauthorizedException('Session expirée');
    const refresh = await this.sessions.rotate(token, meta);
    return this.withAccessToken(refresh);
  }

  logout(token: string | undefined): Promise<void> {
    return this.sessions.revoke(token);
  }

  private async openSession(
    matricule: number,
    meta: ClientMeta,
  ): Promise<SessionOutcome> {
    return this.withAccessToken(await this.sessions.open(matricule, meta));
  }

  /** The role in the token always comes from the database, never from the old token. */
  private async withAccessToken(
    refresh: IssuedSession,
  ): Promise<SessionOutcome> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { matricule: refresh.matricule },
      select: PUBLIC_USER_SELECT,
    });
    const payload: AccessPayload = {
      matricule: user.matricule,
      role: user.role,
      typ: 'access',
    };
    return {
      kind: 'session',
      user,
      accessToken: this.jwtService.sign(payload),
      refresh,
    };
  }

  private signMfaToken(matricule: number, stage: MfaStage): string {
    const payload: MfaPayload = { matricule, stage, typ: 'mfa' };
    return this.jwtService.sign(payload, {
      audience: MFA_AUDIENCE,
      expiresIn: '5m',
    });
  }

  private async readMfaToken(
    token: string,
    stage?: MfaStage,
  ): Promise<MfaPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<MfaPayload>(token, {
        audience: MFA_AUDIENCE,
      });
      if (payload.typ !== 'mfa' || (stage && payload.stage !== stage))
        throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException('Session de connexion expirée');
    }
  }

  /** Counts a failure; from the 5th in a row the account locks, doubling up to an hour. */
  private async registerFailure(matricule: number, previous: number) {
    const failures = previous + 1;
    const lockMinutes =
      failures >= LOCK_AFTER_FAILURES
        ? Math.min(2 ** (failures - LOCK_AFTER_FAILURES), MAX_LOCK_MINUTES)
        : 0;
    await this.prisma.user.update({
      where: { matricule },
      data: {
        failedLoginCount: failures,
        lockedUntil: lockMinutes
          ? new Date(Date.now() + lockMinutes * 60_000)
          : undefined,
      },
    });
    this.logger.warn(
      `Authentication failure ${failures} for matricule ${matricule}` +
        (lockMinutes ? `; locked for ${lockMinutes} min` : ''),
    );
  }
}
