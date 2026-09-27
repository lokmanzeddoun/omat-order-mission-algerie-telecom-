import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'nestjs-prisma';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { decrypt, encrypt, sha256 } from '../crypto.util';

const ISSUER = 'OMAT Algérie Télécom';
const STEP_SECONDS = 30;
const RECOVERY_CODES = 10;

// Accept the previous and next 30 s step to absorb phone clock drift.
const totp = authenticator.clone({ window: 1, step: STEP_SECONDS });

export interface Enrollment {
  otpauthUrl: string;
  qrDataUrl: string;
  /** Shown for manual entry when the QR code cannot be scanned. */
  secret: string;
}

const normalizeCode = (code: string) => String(code).replace(/[\s-]/g, '');

/** TOTP second factor for ADMIN and SUPER_ADMIN (ADR 0002). */
@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get key(): string {
    return this.config.get<string>('MFA_ENCRYPTION_KEY');
  }

  /** Creates (or replaces) the pending secret an admin is enrolling. */
  async startEnrollment(matricule: number): Promise<Enrollment> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { matricule },
      select: { email: true, mfaEnabledAt: true },
    });
    if (user.mfaEnabledAt) {
      throw new BadRequestException('MFA déjà activée');
    }
    const secret = totp.generateSecret(20);
    await this.prisma.user.update({
      where: { matricule },
      data: { mfaPendingSecret: encrypt(this.key, secret) },
    });
    const otpauthUrl = totp.keyuri(user.email, ISSUER, secret);
    return {
      otpauthUrl,
      qrDataUrl: await QRCode.toDataURL(otpauthUrl),
      secret,
    };
  }

  /**
   * Confirms the pending secret with a first code and activates MFA.
   * Returns the recovery codes: they are shown once and stored hashed.
   */
  async confirmEnrollment(
    matricule: number,
    code: string,
  ): Promise<string[] | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { matricule },
      select: { mfaPendingSecret: true, mfaEnabledAt: true },
    });
    if (user.mfaEnabledAt || !user.mfaPendingSecret) return null;
    const secret = decrypt(this.key, user.mfaPendingSecret);
    const step = this.matchingStep(normalizeCode(code), secret);
    if (step === null) return null;

    const codes = Array.from({ length: RECOVERY_CODES }, () => {
      const raw = randomBytes(5).toString('hex');
      return `${raw.slice(0, 5)}-${raw.slice(5)}`;
    });
    await this.prisma.user.update({
      where: { matricule },
      data: {
        mfaSecret: user.mfaPendingSecret,
        mfaPendingSecret: null,
        mfaEnabledAt: new Date(),
        mfaLastStep: step,
        mfaRecoveryCodes: codes.map((c) => sha256(c)),
      },
    });
    return codes;
  }

  /** Checks a TOTP code (once per time step) or consumes a recovery code. */
  async verify(matricule: number, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { matricule },
      select: { mfaSecret: true, mfaLastStep: true, mfaRecoveryCodes: true },
    });
    if (!user.mfaSecret) return false;
    const normalized = normalizeCode(code);

    if (/^\d{6}$/.test(normalized)) {
      const step = this.matchingStep(
        normalized,
        decrypt(this.key, user.mfaSecret),
      );
      if (
        step === null ||
        (user.mfaLastStep !== null && step <= user.mfaLastStep)
      ) {
        return false;
      }
      // Conditional update: two concurrent requests cannot both use this step.
      const { count } = await this.prisma.user.updateMany({
        where: {
          matricule,
          OR: [{ mfaLastStep: null }, { mfaLastStep: { lt: step } }],
        },
        data: { mfaLastStep: step },
      });
      return count === 1;
    }

    const lower = normalized.toLowerCase();
    const hash = sha256(`${lower.slice(0, 5)}-${lower.slice(5)}`);
    if (!user.mfaRecoveryCodes.includes(hash)) return false;
    await this.prisma.user.update({
      where: { matricule },
      data: {
        mfaRecoveryCodes: user.mfaRecoveryCodes.filter((c) => c !== hash),
      },
    });
    return true;
  }

  async isEnabled(matricule: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { matricule },
      select: { mfaEnabledAt: true },
    });
    return !!user?.mfaEnabledAt;
  }

  /** SUPER_ADMIN reset (lost phone): the admin enrolls again at next login. */
  async reset(matricule: number): Promise<void> {
    await this.prisma.user.update({
      where: { matricule },
      data: {
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaEnabledAt: null,
        mfaLastStep: null,
        mfaRecoveryCodes: [],
      },
    });
  }

  /** The absolute time step the code matches, or null. */
  private matchingStep(code: string, secret: string): number | null {
    if (!/^\d{6}$/.test(code)) return null;
    const delta = totp.checkDelta(code, secret);
    if (delta === null) return null;
    return Math.floor(Date.now() / 1000 / STEP_SECONDS) + delta;
  }
}
