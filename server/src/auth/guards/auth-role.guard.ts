import { Roles } from 'src/roles/role.decorator';
import { Role } from '@prisma/client';

export function Auth(...roles: Role[]) {
  return roles.length ? Roles(...roles) : () => undefined;
}
