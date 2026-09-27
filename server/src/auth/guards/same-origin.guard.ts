import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig } from 'src/common/configs/config.interface';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * CSRF defence in depth for the cookie-authenticated auth routes: a browser
 * always sends Origin on a POST, so a foreign Origin is refused. Requests
 * without Origin (curl, server-to-server) cannot be forged cross-site.
 */
@Injectable()
export class SameOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const origin = context.switchToHttp().getRequest().headers?.origin;
    if (!origin) return true;
    const auth = this.config.get<AuthConfig>('auth');
    if (auth.allowedOrigins.includes(origin)) return true;
    if (auth.allowLocalhostOrigins) {
      try {
        if (LOCAL_HOSTS.has(new URL(origin).hostname)) return true;
      } catch {
        // fall through
      }
    }
    throw new ForbiddenException('Origine non autorisée');
  }
}
