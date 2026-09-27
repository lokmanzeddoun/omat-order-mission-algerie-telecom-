import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { sha256 } from '../crypto.util';

/**
 * Rate limits by client IP, except on the credential routes, where the
 * counter is per IP *and* account: employees behind one NAT address must not
 * lock each other out, while one account cannot be brute-forced.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const email = req.body?.email;
    if (typeof email === 'string') return `${ip}|${email.trim().toLowerCase()}`;
    const mfaToken = req.body?.mfaToken;
    if (typeof mfaToken === 'string')
      return `${ip}|mfa:${sha256(mfaToken).slice(0, 16)}`;
    return ip;
  }
}
