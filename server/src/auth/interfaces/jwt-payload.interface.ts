import { Role } from '@prisma/client';

export interface JwtPayload {
  matricule: number;
  role: Role;
}
