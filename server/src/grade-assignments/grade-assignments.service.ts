import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, GradeAssignment, Prisma, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { AuditService } from 'src/audit/audit.service';
import { CreateGradeAssignmentDto } from './dto/create-grade-assignment.dto';
import {
  algiersDay,
  checkNewPeriod,
  dayOf,
  effectiveEnd,
  EffectiveCategory,
  PeriodViolation,
  resolveEffectiveCategory,
  toDate,
} from './grade-assignment.rules';

/** What a mission freezes when it is created. */
export interface CategorySnapshot {
  effectiveCategory: Category;
  gradeAssignmentId: number | null;
}

const violationMessage = (v: PeriodViolation): string => {
  switch (v.code) {
    case 'ORDER':
      return 'La date de fin doit être postérieure ou égale à la date de début.';
    case 'NOT_HIGHER':
      return "La catégorie visée doit être strictement supérieure à celle de l'agent.";
    case 'OVERLAP':
      return `Cette période chevauche la période n° ${v.with} du même agent.`;
    case 'CAP':
      return `Une période continue ne peut dépasser ${v.months} mois : elle doit se terminer au plus tard le ${v.maxEnd} (début de la période continue : ${v.chainStart}).`;
  }
};

type Db = Pick<DatabaseService, 'gradeAssignment'>;

@Injectable()
export class GradeAssignmentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  /**
   * The category (and period) an ordre starting at `missionStart` is priced
   * at. Missions call this once, at creation, and freeze the result.
   */
  async effectiveFor(
    userId: number,
    own: Category,
    missionStart: Date,
    client: Db = this.db,
  ): Promise<EffectiveCategory> {
    const day = toDate(algiersDay(missionStart));
    const candidates = await client.gradeAssignment.findMany({
      where: { userId, startDate: { lte: day }, endDate: { gte: day } },
    });
    return resolveEffectiveCategory(own, candidates, missionStart);
  }

  /** The snapshot a new or re-dated ordre stores. */
  async snapshotFor(
    userId: number,
    own: Category,
    missionStart: Date | null,
    client: Db = this.db,
  ): Promise<CategorySnapshot> {
    const eff = await this.effectiveFor(
      userId,
      own,
      missionStart ?? new Date(),
      client,
    );
    return {
      effectiveCategory: eff.category,
      gradeAssignmentId: eff.assignmentId,
    };
  }

  list(userId?: number) {
    return this.db.gradeAssignment.findMany({
      where: userId ? { userId } : {},
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
      include: {
        user: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
            category: true,
          },
        },
      },
    });
  }

  async create(dto: CreateGradeAssignmentDto, actor: User) {
    const user = await this.db.user.findUnique({
      where: { matricule: dto.userId },
      select: { matricule: true, category: true },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${dto.userId} introuvable.`);
    }
    for (const day of [dto.startDate, dto.endDate]) {
      if (isNaN(toDate(day).getTime()) || dayOf(toDate(day)) !== day) {
        throw new BadRequestException(`Date invalide : ${day}`);
      }
    }
    const created = await this.db.$transaction(
      async (tx) => {
        const existing = await tx.gradeAssignment.findMany({
          where: { userId: user.matricule },
        });
        const violation = checkNewPeriod(user.category, existing, {
          kind: dto.kind,
          targetCategory: dto.targetCategory,
          start: dto.startDate,
          end: dto.endDate,
        });
        if (violation) {
          const message = violationMessage(violation);
          throw violation.code === 'OVERLAP'
            ? new ConflictException(message)
            : new BadRequestException(message);
        }
        return tx.gradeAssignment.create({
          data: {
            userId: user.matricule,
            kind: dto.kind,
            targetCategory: dto.targetCategory,
            startDate: toDate(dto.startDate),
            endDate: toDate(dto.endDate),
            decisionRef: dto.decisionRef.trim(),
            createdById: actor.matricule,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.audit.record({
      actorMatricule: actor.matricule,
      action: 'GRADE_ASSIGNMENT_CREATED',
      entity: 'GradeAssignment',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  /**
   * Ends a period early, effective today. The row is kept: the ordres that
   * already used it keep their snapshot, and the history stays readable.
   */
  async end(
    id: number,
    actor: User,
    reason?: string,
  ): Promise<GradeAssignment> {
    const current = await this.db.gradeAssignment.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Période ${id} introuvable.`);
    }
    if (current.endedAt) {
      throw new BadRequestException('Cette période est déjà terminée.');
    }
    if (dayOf(current.endDate) < algiersDay(new Date())) {
      throw new BadRequestException('Cette période est déjà échue.');
    }
    const updated = await this.db.gradeAssignment.update({
      where: { id },
      data: { endedAt: new Date() },
    });
    await this.audit.record({
      actorMatricule: actor.matricule,
      action: 'GRADE_ASSIGNMENT_ENDED',
      entity: 'GradeAssignment',
      entityId: id,
      before: current,
      after: { ...updated, effectiveEnd: effectiveEnd(updated) },
      reason: reason?.trim() || undefined,
    });
    return updated;
  }
}
