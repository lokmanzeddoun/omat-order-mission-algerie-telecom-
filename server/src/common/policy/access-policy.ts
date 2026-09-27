import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  DecompteStatus,
  MissionStatus,
  Prisma,
  Role,
  User,
} from '@prisma/client';

/**
 * A serviceId no real structure can have. An ADMIN with no assigned structure
 * matches nothing, rather than accidentally matching rows whose serviceId is null.
 */
const NO_STRUCTURE = '__NO_ASSIGNED_STRUCTURE__';

/** The fields of the authenticated user the policy needs. */
export type Actor = Pick<User, 'matricule' | 'role' | 'serviceId'>;

/**
 * The single source of truth for "who may see and change what" (ADR 0001).
 *
 * The `scope*` methods return Prisma `where` fragments that every service
 * merges into its query — `findFirst({ where: { id, ...scope } })` — so a read
 * outside the caller's scope simply returns nothing (the service turns that
 * into a 404, and ids never leak). Writes the caller may see but not perform
 * (self-approval, a locked record) throw 403 via the `assert*` helpers.
 *
 *   USER        → only their own ordres de mission, décomptes and commentaires.
 *   ADMIN       → everything within their own structure (`serviceId`).
 *   SUPER_ADMIN → everything.
 */
@Injectable()
export class AccessPolicy {
  private isSuper(a: Actor): boolean {
    return a.role === Role.SUPER_ADMIN;
  }
  private isAdmin(a: Actor): boolean {
    return a.role === Role.ADMIN;
  }
  private adminStructure(a: Actor): string {
    return a.serviceId ?? NO_STRUCTURE;
  }

  scopeMissions(actor: Actor): Prisma.MissionWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor))
      return { user: { serviceId: this.adminStructure(actor) } };
    return { userId: actor.matricule };
  }

  scopeUsers(actor: Actor): Prisma.UserWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor)) {
      return { serviceId: this.adminStructure(actor) };
    }
    return { matricule: actor.matricule };
  }

  scopeStructures(actor: Actor): Prisma.StructureWhereInput {
    if (this.isSuper(actor)) return {};
    return { code: actor.serviceId ?? NO_STRUCTURE };
  }

  scopeDecomptes(actor: Actor): Prisma.DecompteWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor))
      return { mission: { user: { serviceId: this.adminStructure(actor) } } };
    return { mission: { userId: actor.matricule } };
  }

  scopeComments(actor: Actor): Prisma.CommentaireWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor))
      return { user: { serviceId: this.adminStructure(actor) } };
    return { userId: actor.matricule };
  }

  /** Whether an ADMIN may create/administer a resource owned by `targetServiceId`. */
  canActInStructure(actor: Actor, targetServiceId: string | null): boolean {
    if (this.isSuper(actor)) return true;
    if (this.isAdmin(actor))
      return Boolean(actor.serviceId && actor.serviceId === targetServiceId);
    return false;
  }

  canAccessUser(
    actor: Actor,
    target: Pick<User, 'matricule' | 'serviceId'>,
  ): boolean {
    if (this.isSuper(actor)) return true;
    if (this.isAdmin(actor)) {
      return Boolean(actor.serviceId && actor.serviceId === target.serviceId);
    }
    return actor.matricule === target.matricule;
  }

  /**
   * Separation of duties (ADR 0001): an approver may never decide on a record
   * they own. `ownerMatricule` is the matricule of the mission's owner.
   */
  assertNotSelfApproval(actor: Actor, ownerMatricule: number): void {
    if (actor.matricule === ownerMatricule) {
      throw new ForbiddenException(
        'You cannot validate or decide on your own record.',
      );
    }
  }

  /** A validated (COMPLETED) ordre de mission is read-only until a reopen (issue 07). */
  assertMissionEditable(status: MissionStatus | null | undefined): void {
    if (status === MissionStatus.COMPLETED) {
      throw new ForbiddenException(
        'This ordre de mission is validated and locked.',
      );
    }
  }

  /** An accepted or rejected décompte is read-only until a reopen (issue 07). */
  assertDecompteEditable(status: DecompteStatus): void {
    if (status !== DecompteStatus.PENDING) {
      throw new ForbiddenException(
        `This décompte is ${status.toLowerCase()} and locked.`,
      );
    }
  }
}
