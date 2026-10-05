import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { DatabaseService } from 'src/database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import { ExercicesService } from 'src/exercices/exercices.service';
import { CommentsService } from 'src/comments/comments.service';
import { partitionIds } from 'src/common/bulk';
import {
  Barem,
  DecompteStatus,
  Direction,
  Mission,
  MissionStatus,
  TransportType,
  User,
} from '@prisma/client';
import { Response as ExpressResponse } from 'express';
import { PdfService } from 'src/pdf/pdf.service';
import { toDecomptePdfData } from 'src/pdf/mappers/decompte.mapper';
import {
  computeMontant,
  toColumns,
  toCounts,
  totalMeals,
  totalNights,
  zonesOutside,
  MIN_PARCOURS_KM,
} from './montant';
import { assertMissionDuration } from '../missions/mission-duration';
import { algiersDay } from 'src/grade-assignments/grade-assignment.rules';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { AuditService } from 'src/audit/audit.service';

/** The barème rates a décompte freezes when it is settled. */
const rateColumns = (b: Barem) => ({
  barem_repas_nord: b.repas_nord,
  barem_hebergement_nord: b.hebergement_nord,
  barem_repas_sud: b.repas_sud,
  barem_hebergement_sud: b.hebergement_sud,
  barem_montant_km: b.montant_km,
});

const directionLabel: Record<Direction, string> = {
  NORD: 'Nord',
  SUD: 'Sud',
  MIXTE: 'Nord et Sud',
};

/** Comment titles written when a décompte is accepted or rejected. */
/** Why an ordre of a bulk validation can't be validated. */
const bulkValidateReason: Record<string, string> = {
  not_found: 'ordre introuvable',
  self_owned: 'vous ne pouvez pas valider votre propre ordre',
  not_inprogress:
    'seul un ordre en cours, non archivé et sans décompte peut être validé',
};

export const statusCommentTitle = {
  accepted: (id: number, message: string) =>
    `Decompte #${id} accepted: ${message}`,
  rejected: (id: number, message: string) =>
    `Decompte #${id} rejected: ${message}`,
};

@Injectable()
export class DecompteService {
  private readonly logger = new Logger(DecompteService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly exercicesService: ExercicesService,
    private readonly commentsService: CommentsService,
    private readonly pdfService: PdfService,
    private readonly accessPolicy: AccessPolicy,
    private readonly audit: AuditService,
  ) {}

  async reopen(id: number, reason: string, actor: User) {
    const current = await this.databaseService.decompte.findUnique({
      where: { n_decompte: id },
    });
    if (!current)
      throw new NotFoundException(`Decompte with ID ${id} not found.`);
    if (current.status === DecompteStatus.PENDING) {
      throw new BadRequestException('Ce décompte est déjà en attente.');
    }
    const updated = await this.databaseService.decompte.update({
      where: { n_decompte: id },
      data: {
        status: DecompteStatus.PENDING,
        decidedById: null,
        decidedAt: null,
      },
    });
    await this.audit.record({
      actorMatricule: actor.matricule,
      action: 'DECOMPTE_REOPENED',
      entity: 'Decompte',
      entityId: id,
      before: current,
      after: updated,
      reason,
    });
    return updated;
  }

  private async getCurrentExerciceId(): Promise<number | null> {
    await this.exercicesService.ensureCurrentForNow();
    const ex = await this.databaseService['exercice'].findFirst({
      where: { isCurrent: true },
    });
    return ex?.id ?? null;
  }

  /**
   * Checks the declared meals and nights against the trip and the ordre's
   * Direction, then prices them with the barème of the ordre's agent.
   */
  private async settle(
    dto: CreateDecompteDto,
    mission: Pick<
      Mission,
      'date_sortie' | 'direction' | 'transport' | 'effectiveCategory'
    > & {
      user: Pick<User, 'category'>;
    },
  ) {
    if (
      mission.transport === TransportType.PERSONAL_CAR &&
      !(dto.parcours >= MIN_PARCOURS_KM)
    ) {
      throw new BadRequestException(
        `La distance parcourue doit être d'au moins ${MIN_PARCOURS_KM} km.`,
      );
    }
    const counts = toCounts(dto);
    if (zonesOutside(mission.direction, counts).length > 0) {
      throw new BadRequestException(
        `Les repas et nuitées doivent être déclarés dans la direction de l'ordre de mission (${directionLabel[mission.direction]})`,
      );
    }
    // The departure day as the agent sees it on the ordre (an Algiers day, like
    // the UI): a midnight departure is stored as 23:00 UTC the day before.
    const departureDay = algiersDay(mission.date_sortie);
    // Validating or editing the décompte sets the real return: the trip stays within the limit.
    assertMissionDuration(
      new Date(`${departureDay}T${dto.heure_sortie}:00`),
      new Date(`${dto.date_retour}T${dto.heure_retour}:00`),
    );
    const { meals, accommodations } = calculateMealsAndAccommodation(
      departureDay,
      dto.heure_sortie,
      dto.date_retour,
      dto.heure_retour,
    );
    if (
      meals !== totalMeals(counts) ||
      accommodations !== totalNights(counts)
    ) {
      throw new BadRequestException(
        `Le nombre de repas et hebergement non valid : le trajet compte ${meals} repas et ${accommodations} nuitée(s).`,
      );
    }
    // The barème comes from the category frozen on the ordre (the agent's own,
    // or the Interim/Remplaçant one covering the start date); an ordre written
    // before that snapshot existed falls back to the agent's category.
    const userCategory = mission.effectiveCategory ?? mission.user.category;
    if (!userCategory) {
      throw new BadRequestException(
        "La requete ne peu pas terminne l'utilisateur n'a pas un categorie",
      );
    }
    const categoryBarem = await this.databaseService.barem.findFirstOrThrow({
      where: {
        libell: userCategory,
      },
    });
    const montant = computeMontant(
      {
        counts,
        transport: mission.transport,
        parcours: dto.parcours,
        fees_transport: dto.fees_transport,
      },
      categoryBarem,
    );
    return { counts, montant, rates: rateColumns(categoryBarem) };
  }

  async create(createDecompteDto: CreateDecompteDto, id: number, actor: User) {
    const mission = await this.databaseService.mission.findUnique({
      where: {
        n_mission: id,
      },
      include: { user: true, _count: { select: { decompte: true } } },
    });
    if (!mission) {
      throw new NotFoundException(`Mission ${id} not found`);
    }
    // An ADMIN may only validate a mission inside their own structure (ADR 0001);
    // an out-of-scope mission is a 404, not a hint that it exists.
    if (!this.accessPolicy.canActInStructure(actor, mission.user.serviceId)) {
      throw new NotFoundException(`Mission ${id} not found`);
    }
    // Validating an ordre gives rise to a payment: never on one's own (ADR 0001).
    this.accessPolicy.assertNotSelfApproval(actor, mission.userId);
    if (
      mission.soft_delete ||
      mission.status !== MissionStatus.INPROGRESS ||
      mission._count.decompte > 0
    ) {
      throw new BadRequestException(
        'Seul un ordre de mission en cours, non archivé et sans décompte peut être validé',
      );
    }
    const settled = await this.settle(createDecompteDto, mission);
    const exerciceId = await this.getCurrentExerciceId();
    return this.databaseService.$transaction(
      this.validationOps(id, createDecompteDto, settled, exerciceId),
    );
  }

  /**
   * Validates several ordres with the same figures (one shared form), all or
   * nothing: every ordre must be validatable and its trip must match the
   * declared meals and nights, or none is validated and the error names each
   * ordre at fault.
   */
  async createMany(ids: number[], dto: CreateDecompteDto, actor: User) {
    const unique = [...new Set(ids)];
    const missions = await this.databaseService.mission.findMany({
      where: { n_mission: { in: unique } },
      include: { user: true, _count: { select: { decompte: true } } },
    });
    const byId = new Map(missions.map((m) => [m.n_mission, m]));
    const { done, skipped } = partitionIds(unique, byId, (m) =>
      // Out of scope reads as not found (ADR 0001).
      !this.accessPolicy.canActInStructure(actor, m.user.serviceId)
        ? 'not_found'
        : // Separation of duties: never validate one's own ordre.
          m.userId === actor.matricule
          ? 'self_owned'
          : m.soft_delete ||
              m.status !== MissionStatus.INPROGRESS ||
              m._count.decompte > 0
            ? 'not_inprogress'
            : null,
    );
    const problems = skipped.map(
      ({ id, reason }) => `N° ${id} : ${bulkValidateReason[reason]}`,
    );

    const settled: {
      id: number;
      result: Awaited<ReturnType<DecompteService['settle']>>;
    }[] = [];
    for (const id of done) {
      try {
        settled.push({ id, result: await this.settle(dto, byId.get(id)!) });
      } catch (e) {
        if (!(e instanceof BadRequestException)) throw e;
        problems.push(`N° ${id} : ${e.message}`);
      }
    }
    if (problems.length > 0) {
      throw new BadRequestException(
        `Aucun ordre n'a été validé. ${problems.join(' ; ')}`,
      );
    }

    const exerciceId = await this.getCurrentExerciceId();
    await this.databaseService.$transaction(
      settled.flatMap(({ id, result }) =>
        this.validationOps(id, dto, result, exerciceId),
      ),
    );
    return { done: settled.map(({ id }) => id) };
  }

  /** Completes the ordre with its real return and records its décompte. */
  private validationOps(
    id: number,
    dto: CreateDecompteDto,
    { counts, montant, rates }: Awaited<ReturnType<DecompteService['settle']>>,
    exerciceId: number | null,
  ) {
    const updateMission = this.databaseService.mission.update({
      where: {
        n_mission: id,
      },
      data: {
        status: MissionStatus.COMPLETED,
        // Combine provided date_retour and heure_retour into a single DateTime
        date_retour: new Date(
          `${dto.date_retour}T${dto.heure_retour}:00`,
        ).toISOString(),
      },
    });
    const createDecomte = this.databaseService.decompte.create({
      data: {
        ...toColumns(counts),
        ...rates,
        montant: montant,
        parcours: dto.parcours ? dto.parcours : null,
        fees_transport: dto.fees_transport ? dto.fees_transport : 0,
        mission: {
          connect: { n_mission: id },
        },
        ...(exerciceId ? { exercice: { connect: { id: exerciceId } } } : {}),
      },
    });
    return [updateMission, createDecomte];
  }

  async findAll(
    actor: User,
    status: string,
    archive: string,
    exercice?: string,
  ) {
    // convert status to DcompteStatus
    let sat: DecompteStatus | undefined;
    if (status === 'accepted') {
      sat = DecompteStatus.ACCEPTED;
    } else if (status === 'regected') {
      sat = DecompteStatus.REGECTED;
    } else if (status === 'pending') {
      sat = DecompteStatus.PENDING;
    }
    // If status is not provided or invalid, sat will be undefined and won't filter by status

    let year = exercice ? Number(exercice) : undefined;
    if (!year) {
      await this.exercicesService.ensureCurrentForNow();
      const ex = await this.databaseService['exercice'].findFirst({
        where: { isCurrent: true },
      });
      year = ex?.year;
    }

    // Determine soft_delete filter based on archive parameter
    const softDeleteFilter = archive === 'true';

    return this.databaseService.decompte.findMany({
      where: {
        // Only the décomptes the caller may see (own / structure / all).
        ...this.accessPolicy.scopeDecomptes(actor),
        soft_delete: softDeleteFilter,
        ...(sat ? { status: sat } : {}),
        ...(year ? { exercice: { year } } : {}),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        n_decompte: true,
        repas_pec_nord: true,
        repas_pec_sud: true,
        repas_sans_pec_nord: true,
        repas_sans_pec_sud: true,
        hebergement_pec_nord: true,
        hebergement_pec_sud: true,
        hebergement_sans_pec_nord: true,
        hebergement_sans_pec_sud: true,
        montant: true,
        parcours: true,
        fees_transport: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        mission: {
          select: {
            date_retour: true,
            date_sortie: true,
            transport: true,
            motif: true,
            destination: true,
            direction: true,
            n_mission: true,
            user: {
              select: {
                matricule: true,
                prenom: true,
                nom: true,
                email: true,
              },
            },
          },
        },
        messages: {
          where: { soft_delete: false },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findOne(id: number, actor: User) {
    // Scoped read: out-of-scope or missing ids return 404, so ids don't leak.
    const decompte = await this.databaseService.decompte.findFirst({
      where: {
        n_decompte: id,
        soft_delete: false,
        ...this.accessPolicy.scopeDecomptes(actor),
      },
      select: {
        n_decompte: true,
        repas_pec_nord: true,
        repas_pec_sud: true,
        repas_sans_pec_nord: true,
        repas_sans_pec_sud: true,
        hebergement_pec_nord: true,
        hebergement_pec_sud: true,
        hebergement_sans_pec_nord: true,
        hebergement_sans_pec_sud: true,
        montant: true,
        parcours: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        mission: {
          select: {
            date_retour: true,
            date_sortie: true,
            transport: true,
            motif: true,
            destination: true,
            direction: true,
            n_mission: true,
            user: {
              select: {
                matricule: true,
                prenom: true,
                nom: true,
                email: true,
                grade: true,
                category: true,
                structure: {
                  select: {
                    code: true,
                    name: true,
                    parentCode: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          where: { soft_delete: false },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                matricule: true,
                nom: true,
                prenom: true,
                role: true,
              },
            },
          },
        },
      },
    });
    if (!decompte) {
      throw new NotFoundException(`Décompte ${id} introuvable.`);
    }
    return decompte;
  }

  async update(id: number, updateDecompteDto: CreateDecompteDto, actor: User) {
    // Scoped fetch: an ADMIN only within their structure (404 otherwise).
    const decompte = await this.databaseService.decompte.findFirst({
      where: {
        n_decompte: id,
        soft_delete: false,
        ...this.accessPolicy.scopeDecomptes(actor),
      },
      include: {
        mission: { include: { user: true } },
      },
    });
    if (!decompte) {
      throw new NotFoundException(`Décompte ${id} introuvable.`);
    }
    // An accepted/rejected décompte is locked: only a pending one can be edited.
    if (decompte.status !== DecompteStatus.PENDING) {
      throw new BadRequestException(
        'Seul un décompte en attente peut être modifié',
      );
    }
    const { counts, montant, rates } = await this.settle(
      updateDecompteDto,
      decompte.mission,
    );
    const updateMission = this.databaseService.mission.update({
      where: {
        n_mission: decompte.missionId,
      },
      data: {
        // Combine provided date_retour and heure_retour into a single DateTime
        date_retour: new Date(
          `${updateDecompteDto.date_retour}T${updateDecompteDto.heure_retour}:00`,
        ).toISOString(),
      },
    });
    const updateDecompte = this.databaseService.decompte.update({
      where: {
        soft_delete: false,
        n_decompte: id,
      },
      data: {
        ...toColumns(counts),
        ...rates,
        montant: montant,
        parcours: updateDecompteDto.parcours
          ? updateDecompteDto.parcours
          : null,
        fees_transport: updateDecompteDto.fees_transport
          ? updateDecompteDto.fees_transport
          : 0,
      },
    });
    return this.databaseService.$transaction([updateMission, updateDecompte]);
  }

  async remove(id: number, actor: User) {
    // Scope first (ADR 0001): an out-of-scope id is a 404.
    const decompte = await this.databaseService.decompte.findFirst({
      where: { n_decompte: id, ...this.accessPolicy.scopeDecomptes(actor) },
      select: { n_decompte: true },
    });
    if (!decompte) {
      throw new NotFoundException(`Décompte ${id} introuvable.`);
    }
    return this.databaseService.decompte.update({
      where: {
        n_decompte: id,
      },
      data: archiveStamp(actor.matricule),
    });
  }

  getUserDecompte(user: User, status?: string, exercice?: string) {
    let sat: DecompteStatus | undefined;
    if (status === 'accepted') {
      sat = DecompteStatus.ACCEPTED;
    } else if (status === 'rejected') {
      sat = DecompteStatus.REGECTED;
    } else if (status === 'pending') {
      sat = DecompteStatus.PENDING;
    }

    return this.databaseService.decompte.findMany({
      where: {
        mission: {
          user: {
            matricule: user.matricule,
          },
        },
        soft_delete: false,
        ...(sat ? { status: sat } : {}),
        ...(exercice ? { exercice: { year: Number(exercice) } } : {}),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        mission: {
          select: {
            n_mission: true,
            destination: true,
            motif: true,
            date_sortie: true,
            date_retour: true,
            direction: true,
            transport: true,
          },
        },
        messages: {
          where: { soft_delete: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async downloadDecompte(id: number, res: ExpressResponse, actor: User) {
    // A décompte PDF is confidential financial data: scope the read (404 out of scope).
    const decompte = await this.databaseService.decompte.findFirst({
      where: { n_decompte: id, ...this.accessPolicy.scopeDecomptes(actor) },
      include: {
        mission: {
          include: {
            user: { include: { structure: true } },
            gradeAssignment: { select: { kind: true } },
          },
        },
      },
    });
    if (!decompte) {
      throw new NotFoundException(`Décompte ${id} introuvable.`);
    }

    // The PDF reads the barème rates frozen on the décompte, never the live
    // ones: a later barème edit or category change cannot alter a reprint.
    let pdf: Buffer;
    try {
      pdf = await this.pdfService.renderDecompte(toDecomptePdfData(decompte));
    } catch (e) {
      this.logger.error(`Failed to render décompte ${id}`, (e as Error).stack);
      throw new InternalServerErrorException(
        'Impossible de générer le PDF du décompte.',
      );
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=decompte-${id}.pdf`,
    });
    return res.send(pdf);
  }

  /**
   * One PDF holding every listed décompte, in the requested order. Like the
   * single download, any id missing or outside the caller's scope is a 404.
   */
  async downloadMany(ids: number[], res: ExpressResponse, actor: User) {
    const unique = [...new Set(ids)];
    const decomptes = await this.databaseService.decompte.findMany({
      where: {
        n_decompte: { in: unique },
        ...this.accessPolicy.scopeDecomptes(actor),
      },
      include: {
        mission: {
          include: {
            user: { include: { structure: true } },
            gradeAssignment: { select: { kind: true } },
          },
        },
      },
    });
    const byId = new Map(decomptes.map((d) => [d.n_decompte, d]));
    const missing = unique.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Décompte(s) ${missing.join(', ')} introuvable(s).`,
      );
    }

    let pdf: Buffer;
    try {
      pdf = await this.pdfService.renderDecomptes(
        unique.map((id) => toDecomptePdfData(byId.get(id)!)),
      );
    } catch (e) {
      this.logger.error('Failed to render décomptes batch', (e as Error).stack);
      throw new InternalServerErrorException(
        'Impossible de générer le PDF des décomptes.',
      );
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=decomptes-${unique.length}.pdf`,
    });
    return res.send(pdf);
  }

  /**
   * Accept a decompte (Admin only)
   * Changes status to ACCEPTED
   */
  async acceptDecompte(id: number, user: User, message?: string): Promise<any> {
    // Scoped fetch: an ADMIN only decides within their structure (404 otherwise).
    const decompte = await this.databaseService.decompte.findFirst({
      where: {
        n_decompte: id,
        soft_delete: false,
        ...this.accessPolicy.scopeDecomptes(user),
      },
      include: { mission: { include: { user: true } } },
    });

    if (!decompte) {
      throw new NotFoundException(`Decompte with ID ${id} not found.`);
    }

    // Separation of duties: an approver may not decide on their own décompte.
    this.accessPolicy.assertNotSelfApproval(user, decompte.mission.userId);

    if (decompte.status !== DecompteStatus.PENDING) {
      throw new BadRequestException(
        `Decompte ${id} is not in PENDING status. Current status: ${decompte.status}`,
      );
    }

    // Update decompte status to ACCEPTED, recording who decided (ADR 0001).
    const updatedDecompte = await this.databaseService.decompte.update({
      where: { n_decompte: id },
      data: {
        status: DecompteStatus.ACCEPTED,
        decidedById: user.matricule,
        decidedAt: new Date(),
      },
    });

    // Optionally create a comment if a message was provided
    if (message && message.trim() !== '') {
      await this.commentsService.recordStatusComment(
        {
          title: statusCommentTitle.accepted(id, message.trim()),
          type: 'DECOMPTE_STATUS',
          status: 'ACCEPTED',
          decompteId: id,
        },
        user.matricule,
      );
    }

    return updatedDecompte;
  }

  /**
   * Reject a decompte (Admin only)
   * Changes status to REJECTED and creates a comment with rejection reason
   */
  async rejectDecompte(id: number, user: User, message: string): Promise<any> {
    // Scoped fetch: an ADMIN only decides within their structure (404 otherwise).
    const decompte = await this.databaseService.decompte.findFirst({
      where: {
        n_decompte: id,
        soft_delete: false,
        ...this.accessPolicy.scopeDecomptes(user),
      },
      include: { mission: { include: { user: true } } },
    });

    if (!decompte) {
      throw new NotFoundException(`Decompte with ID ${id} not found.`);
    }

    // Separation of duties: an approver may not decide on their own décompte.
    this.accessPolicy.assertNotSelfApproval(user, decompte.mission.userId);

    if (decompte.status !== DecompteStatus.PENDING) {
      throw new BadRequestException(
        `Decompte ${id} is not in PENDING status. Current status: ${decompte.status}`,
      );
    }

    // Update decompte status to REJECTED, recording who decided (ADR 0001).
    const updatedDecompte = await this.databaseService.decompte.update({
      where: { n_decompte: id },
      data: {
        status: DecompteStatus.REGECTED,
        decidedById: user.matricule,
        decidedAt: new Date(),
      },
    });

    // Create a comment with the rejection reason
    await this.commentsService.recordStatusComment(
      {
        title: statusCommentTitle.rejected(id, message),
        type: 'DECOMPTE_STATUS',
        status: 'REJECTED',
        decompteId: id,
      },
      user.matricule,
    );

    return updatedDecompte;
  }

  /**
   * Accept or reject several pending décomptes at once (Admin only).
   * Rows that are archived or no longer pending are skipped. Comments are
   * written as in acceptDecompte / rejectDecompte: always on reject, and on
   * accept only when a message is given.
   */
  bulkSetStatus(
    ids: number[],
    decision: 'accept' | 'reject',
    actor: User,
    message?: string,
  ) {
    const text = message?.trim();
    return this.databaseService.$transaction(async (tx) => {
      // Scope the rows to the actor (ADR 0001); ids outside scope are simply
      // absent from `rows` and reported as not_found by partitionIds.
      const rows = await tx.decompte.findMany({
        where: {
          n_decompte: { in: ids },
          ...this.accessPolicy.scopeDecomptes(actor),
        },
        select: {
          n_decompte: true,
          status: true,
          soft_delete: true,
          mission: { select: { userId: true } },
        },
      });
      const result = partitionIds(
        ids,
        new Map(rows.map((r) => [r.n_decompte, r])),
        (r) =>
          r.soft_delete
            ? 'archived'
            : r.status !== DecompteStatus.PENDING
              ? 'not_pending'
              : // Separation of duties: never decide on your own décompte.
                r.mission.userId === actor.matricule
                ? 'self_owned'
                : null,
      );
      if (result.done.length === 0) return result;

      await tx.decompte.updateMany({
        where: { n_decompte: { in: result.done } },
        data: {
          status:
            decision === 'accept'
              ? DecompteStatus.ACCEPTED
              : DecompteStatus.REGECTED,
          decidedById: actor.matricule,
          decidedAt: new Date(),
        },
      });
      if (decision === 'reject' || text) {
        await tx.commentaire.createMany({
          data: result.done.map((id) => ({
            title: statusCommentTitle[
              decision === 'accept' ? 'accepted' : 'rejected'
            ](id, text),
            type: 'DECOMPTE_STATUS' as const,
            status: decision === 'accept' ? 'ACCEPTED' : 'REJECTED',
            decompteId: id,
            userId: actor.matricule,
          })),
        });
      }
      return result;
    });
  }
}
const calculateMealsAndAccommodation = (
  date_sortie: string,
  heure_sortie: string,
  date_retour: string,
  heure_retour: string,
) => {
  try {
    // Ensure time format includes seconds for proper Date parsing
    const formattedHeureSortie =
      heure_sortie.includes(':') && heure_sortie.split(':').length === 2
        ? `${heure_sortie}:00`
        : heure_sortie;
    const formattedHeureRetour =
      heure_retour.includes(':') && heure_retour.split(':').length === 2
        ? `${heure_retour}:00`
        : heure_retour;

    const start = new Date(`${date_sortie}T${formattedHeureSortie}`);
    const end = new Date(`${date_retour}T${formattedHeureRetour}`);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { meals: 0, accommodations: 0 };
    }

    let meals = 0;
    let accommodations = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      // Check for lunch (11:00 to 14:00)
      if (isWithinTimeRange(currentDate, 11, 0, 14, 0, start, end)) {
        meals++;
      }

      // Check for dinner (18:00 to 21:00)
      if (isWithinTimeRange(currentDate, 18, 0, 21, 0, start, end)) {
        meals++;
      }

      // Check for accommodation (00:00 to 06:00)
      if (isWithinTimeRange(currentDate, 0, 0, 6, 0, start, end)) {
        accommodations++;
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return { meals, accommodations };
  } catch {
    return { meals: 0, accommodations: 0 };
  }
};

function isWithinTimeRange(
  date: Date,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  tripStart: Date,
  tripEnd: Date,
): boolean {
  const rangeStart: Date = new Date(date);
  rangeStart.setHours(startHour, startMinute, 0, 0);

  const rangeEnd: Date = new Date(date);
  rangeEnd.setHours(endHour, endMinute, 0, 0);

  return rangeStart >= tripStart && rangeEnd <= tripEnd;
}
