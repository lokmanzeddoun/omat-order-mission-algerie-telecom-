import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const ALLOWED_KEY = 'allowWithTemporaryPassword';

/** Marks a route a user may call while still holding a temporary password. */
export const AllowWithTemporaryPassword = () => SetMetadata(ALLOWED_KEY, true);

/** Response code the client uses to send the user to the password form. */
export const PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED';

/**
 * A user signed in with a temporary password (new account, admin reset) may
 * only change it: everything else answers 403 until they choose their own.
 */
@Injectable()
export class PasswordChangeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user?.mustChangePassword) return true;
    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOWED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed) return true;
    throw new ForbiddenException({
      statusCode: 403,
      message: 'Vous devez choisir un nouveau mot de passe',
      code: PASSWORD_CHANGE_REQUIRED,
    });
  }
}
