import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  DecompteStatus,
  MissionStatus,
  Prisma,
  Role,
  User,
} from '@prisma/client';
import { descendantsWhere } from 'src/structures/structure-tree';

/**
 * A structure code no real structure can have. An ADMIN with no assigned
 * structure matches nothing, rather than accidentally matching rows whose
 * serviceId is null.
 */
const NO_STRUCTURE = '__NO_ASSIGNED_STRUCTURE__';

/** The fields of the authenticated user the policy needs. */
export type Actor = Pick<User, 'matricule' | 'role' | 'serviceId'> & {
  /**
   * Whether the actor's own structure has a responsible (set by the JWT
   * strategy). A structure without one is visible only to its ancestors'
   * admins and super admins (ADR 0005). Absent means no.
   */
  serviceHasResponsible?: boolean;
  /**
   * Codes of the strict descendants of the actor's own structure (set by the
   * JWT strategy), so `canActInStructure` stays synchronous. Absent means none.
   */
  descendantCodes?: string[];
};

/**
 * The single source of truth for "who may see and change what" (ADR 0001,
 * ADR 0005).
 *
 * The `scope*` methods return Prisma `where` fragments that every service
 * merges into its query — `findFirst({ where: { id, ...scope } })` — so a read
 * outside the caller's scope simply returns nothing (the service turns that
 * into a 404, and ids never leak). Writes the caller may see but not perform
 * (self-approval, a locked record) throw 403 via the `assert*` helpers.
 *
 *   USER        → only their own ordres de mission, décomptes and commentaires.
 *   ADMIN       → everything in their structure's subtree (their structure and
 *                 all its descendants, never upwards or sideways). Their own
 *                 structure counts only if it has a responsible.
 *   SUPER_ADMIN → everything.
 *
 * The tree is at most 3 levels deep (structures/structure-tree.ts), so "in my
 * subtree" is a child or a grandchild and needs no recursive query.
 */
@Injectable()
export class AccessPolicy {
  private isSuper(a: Actor): boolean {
    return a.role === Role.SUPER_ADMIN;
  }
  private isAdmin(a: Actor): boolean {
    return a.role === Role.ADMIN;
  }

  /**
   * The structures an ADMIN administers, as a Structure `where`: the strict
   * descendants of their structure, plus the structure itself when it has a
   * responsible.
   */
  private adminStructures(a: Actor): Prisma.StructureWhereInput {
    const own = a.serviceId ?? NO_STRUCTURE;
    return {
      OR: [
        ...descendantsWhere(own).OR!,
        { code: own, responsibleUserId: { not: null } },
      ],
    };
  }

  scopeMissions(actor: Actor): Prisma.MissionWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor))
      return { user: { structure: this.adminStructures(actor) } };
    return { userId: actor.matricule };
  }

  scopeUsers(actor: Actor): Prisma.UserWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor)) {
      return {
        OR: [
          { structure: this.adminStructures(actor) },
          { matricule: actor.matricule },
        ],
      };
    }
    return { matricule: actor.matricule };
  }

  scopeStructures(actor: Actor): Prisma.StructureWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor)) return this.adminStructures(actor);
    return { code: actor.serviceId ?? NO_STRUCTURE };
  }

  scopeDecomptes(actor: Actor): Prisma.DecompteWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor))
      return {
        mission: { user: { structure: this.adminStructures(actor) } },
      };
    return { mission: { userId: actor.matricule } };
  }

  scopeComments(actor: Actor): Prisma.CommentaireWhereInput {
    if (this.isSuper(actor)) return {};
    if (this.isAdmin(actor))
      return { user: { structure: this.adminStructures(actor) } };
    return { userId: actor.matricule };
  }

  /**
   * Whether an ADMIN may create/administer a resource owned by the structure
   * `targetServiceId`: it must be a descendant of theirs, or their own when it
   * has a responsible.
   */
  canActInStructure(actor: Actor, targetServiceId: string | null): boolean {
    if (this.isSuper(actor)) return true;
    if (!this.isAdmin(actor) || !actor.serviceId || !targetServiceId)
      return false;
    if (targetServiceId === actor.serviceId)
      return Boolean(actor.serviceHasResponsible);
    return (actor.descendantCodes ?? []).includes(targetServiceId);
  }

  canAccessUser(
    actor: Actor,
    target: Pick<User, 'matricule' | 'serviceId'>,
  ): boolean {
    if (this.isSuper(actor)) return true;
    if (actor.matricule === target.matricule) return true;
    if (this.isAdmin(actor)) {
      return this.canActInStructure(actor, target.serviceId);
    }
    return false;
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
