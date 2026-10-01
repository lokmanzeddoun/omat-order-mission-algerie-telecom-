import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import { ExercicesService } from 'src/exercices/exercices.service';
import moment from 'moment';
import { MissionStatus, Prisma, User } from '@prisma/client';
import { Response as ExpressResponse } from 'express';
import { PdfService } from 'src/pdf/pdf.service';
import { toOrdrePdfData } from 'src/pdf/mappers/ordre.mapper';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { AuditService } from 'src/audit/audit.service';
import { GradeAssignmentsService } from 'src/grade-assignments/grade-assignments.service';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { assertMissionDuration } from './mission-duration';
@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly exercicesService: ExercicesService,
    private readonly pdfService: PdfService,
    private readonly accessPolicy: AccessPolicy,
    private readonly audit: AuditService,
    private readonly gradeAssignments: GradeAssignmentsService,
  ) {}

  async reopen(id: number, reason: string, actor: User) {
    const current = await this.databaseService.mission.findUnique({
      where: { n_mission: id },
    });
    if (!current)
      throw new NotFoundException(`Ordre de mission ${id} introuvable.`);
    if (current.status !== MissionStatus.COMPLETED) {
      throw new BadRequestException('Seul un ordre validé peut être rouvert.');
    }
    const updated = await this.databaseService.mission.update({
      where: { n_mission: id },
      data: {
        status: MissionStatus.INPROGRESS,
        validatedById: null,
        validatedAt: null,
      },
    });
    await this.audit.record({
      actorMatricule: actor.matricule,
      action: 'MISSION_REOPENED',
      entity: 'Mission',
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
  async create(createMissionDto: Prisma.MissionCreateInput, user: User) {
    const exerciceId = await this.getCurrentExerciceId();
    // Drop any legacy heure_* fields if present in request body (backward compatibility)
    const {
      heure_sortie: _h1,
      heure_retour: _h2,
      userMatricule: requestedMatricule,
      user: requestedUser,
      ...cleanDto
    } = (createMissionDto as any) || {};
    // Determine target user: default to requester; allow override for admins
    let targetMatricule: number = user.matricule;
    const candidateMatricule: number | null =
      typeof requestedMatricule === 'number'
        ? requestedMatricule
        : requestedUser && typeof requestedUser.matricule === 'number'
          ? requestedUser.matricule
          : null;

    if (candidateMatricule && candidateMatricule !== user.matricule) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          `${user.nom} is not authorized to create missions for other users`,
        );
      }
      // Ensure the target user exists, and that an ADMIN stays inside their
      // own structure (SUPER_ADMIN may target anyone) — ADR 0001.
      const exists = await this.databaseService.user.findUnique({
        where: { matricule: candidateMatricule },
        select: { matricule: true, serviceId: true },
      });
      if (!exists) {
        throw new BadRequestException(
          `Target user with matricule ${candidateMatricule} not found`,
        );
      }
      if (!this.accessPolicy.canActInStructure(user, exists.serviceId)) {
        throw new ForbiddenException(
          'Administrators may create missions only for users in their own structure.',
        );
      }
      targetMatricule = candidateMatricule;
    }
    assertMissionDuration(
      (cleanDto as any).date_sortie
        ? new Date((cleanDto as any).date_sortie)
        : null,
      (cleanDto as any).date_retour
        ? new Date((cleanDto as any).date_retour)
        : null,
    );
    // Freeze the category (and Interim/Remplaçant period, if any) the barème
    // will be read from: it depends on the start date, not on when it is settled.
    const owner = await this.databaseService.user.findUniqueOrThrow({
      where: { matricule: targetMatricule },
      select: { category: true },
    });
    const snapshot = await this.gradeAssignments.snapshotFor(
      targetMatricule,
      owner.category,
      (cleanDto as any).date_sortie
        ? new Date((cleanDto as any).date_sortie)
        : null,
    );
    const res = await this.databaseService.mission.create({
      data: {
        ...cleanDto,
        effectiveCategory: snapshot.effectiveCategory,
        ...(snapshot.gradeAssignmentId
          ? {
              gradeAssignment: { connect: { id: snapshot.gradeAssignmentId } },
            }
          : {}),
        // userId: userData.matricule,
        // Expect full ISO datetime strings; store as Date
        date_sortie: (cleanDto as any).date_sortie
          ? new Date((cleanDto as any).date_sortie as any)
          : null,
        date_retour: (cleanDto as any).date_retour
          ? new Date((cleanDto as any).date_retour as any)
          : null,
        transport: (cleanDto as any).transport || null, // Set transport to null if empty
        user: {
          connect: { matricule: targetMatricule },
        },
        ...(exerciceId ? { exercice: { connect: { id: exerciceId } } } : {}),
      },
    });
    // The mission is already saved: a render failure must not turn into an
    // error, or the client retries and creates a duplicate ordre. The PDF can
    // still be downloaded later from the mission's page.
    let pdf: Buffer;
    try {
      pdf = await this.buildOrdrePdf(res.n_mission);
    } catch (error) {
      this.logger.error(
        `Ordre ${res.n_mission} created but its PDF failed to render`,
        (error as Error).stack,
      );
      return;
    }
    return new StreamableFile(pdf, {
      disposition: `attachment; filename=mission-${res.n_mission}.pdf`,
      type: 'application/pdf',
    });
  }

  async findAll(
    actor: User,
    delete_status: string,
    status: string,
    exercice?: string,
  ) {
    let missionStatus: MissionStatus | undefined;
    if (status === 'completed') {
      missionStatus = MissionStatus.COMPLETED;
    } else if (status === 'inprogress') {
      missionStatus = MissionStatus.INPROGRESS;
    }
    // If status is not provided or invalid, missionStatus will be undefined and won't filter by status

    let year = exercice ? Number(exercice) : undefined;
    if (!year) {
      await this.exercicesService.ensureCurrentForNow();
      const ex = await this.databaseService['exercice'].findFirst({
        where: { isCurrent: true },
      });
      year = ex?.year;
    }
    return this.databaseService.mission.findMany({
      where: {
        // Only the missions the caller may see (own / structure / all).
        ...this.accessPolicy.scopeMissions(actor),
        soft_delete: delete_status === 'true',
        ...(missionStatus ? { status: missionStatus } : {}),
        ...(year ? { exercice: { year } } : {}),
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
      ],
      select: {
        n_mission: true,
        date_sortie: true,
        date_retour: true,
        motif: true,
        transport: true,
        destination: true,
        createdAt: true,
        updatedAt: true,
        soft_delete: true,
        userId: true,
        direction: true,
        status: true,
        user: {
          select: {
            matricule: true, // Fetching specific fields from User
            nom: true, // Select 'nom' from User
            prenom: true, // Select 'prenom' from User
            serviceId: true,
          },
        },
      },
    });
  }

  /**
   * A single mission, but only if it is within the caller's scope. Out-of-scope
   * (or missing) ids return 404 so ids don't leak (ADR 0001).
   */
  async findOne(id: number, actor: User) {
    const mission = await this.databaseService.mission.findFirst({
      where: {
        n_mission: id,
        ...this.accessPolicy.scopeMissions(actor),
      },
    });
    if (!mission) {
      throw new NotFoundException(`Ordre de mission ${id} introuvable.`);
    }
    return mission;
  }
  async findByUser(
    user: User,
    delete_status: string,
    status: string,
    exercice?: string,
  ) {
    let missionStatus: MissionStatus | undefined;
    if (status === 'completed') {
      missionStatus = MissionStatus.COMPLETED;
    } else if (status === 'inprogress') {
      missionStatus = MissionStatus.INPROGRESS;
    }
    // If status is not provided or invalid, missionStatus will be undefined and won't filter by status

    let year = exercice ? Number(exercice) : undefined;
    if (!year) {
      await this.exercicesService.ensureCurrentForNow();
      const ex = await this.databaseService['exercice'].findFirst({
        where: { isCurrent: true },
      });
      year = ex?.year;
    }
    return this.databaseService.mission.findMany({
      where: {
        userId: user.matricule,
        soft_delete: delete_status === 'true',
        ...(missionStatus ? { status: missionStatus } : {}),
        ...(year ? { exercice: { year } } : {}),
      },
      orderBy: [
        {
          updatedAt: 'desc',
        },
      ],
      select: {
        n_mission: true,
        date_sortie: true,
        date_retour: true,
        motif: true,
        transport: true,
        destination: true,
        createdAt: true,
        updatedAt: true,
        soft_delete: true,
        userId: true,
        direction: true,
        status: true,
        user: {
          select: {
            matricule: true, // Fetching specific fields from User
            nom: true, // Select 'nom' from User
            prenom: true, // Select 'prenom' from User
          },
        },
      },
    });
  }

  async update(id: number, updateMissionDto: UpdateMissionDto, actor: User) {
    // The mission must be within the caller's scope (404 otherwise), and a
    // validated ordre is locked (ADR 0001). A USER may not change `direction`.
    const existing = await this.databaseService.mission.findFirst({
      where: { n_mission: id, ...this.accessPolicy.scopeMissions(actor) },
      select: {
        n_mission: true,
        status: true,
        date_sortie: true,
        date_retour: true,
        userId: true,
        user: { select: { category: true } },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Ordre de mission ${id} introuvable.`);
    }
    this.accessPolicy.assertMissionEditable(existing.status);
    if (actor.role === 'USER') {
      delete (updateMissionDto as Record<string, unknown>).direction;
    }
    // Normalize possible Prisma update inputs for date fields.
    const normalizeDateInput = (input: any): Date | null | undefined => {
      if (input === undefined) return undefined; // do not touch field
      if (input === null) return null; // explicit null
      if (typeof input === 'string') {
        const s = input.trim();
        if (!s) return null; // empty string means clear the date
        // Accept full ISO datetime; fall back to strict YYYY-MM-DD
        const mIso = moment(s, moment.ISO_8601, true);
        if (mIso.isValid()) return mIso.toDate();
        const m = moment.utc(s, 'YYYY-MM-DD', true);
        return m.isValid() ? m.toDate() : null; // invalid string clears field
      }
      if (input instanceof Date) {
        return isNaN(input.getTime()) ? null : input;
      }
      if (typeof input === 'object' && 'set' in input) {
        // Handle Prisma DateTimeFieldUpdateOperationsInput
        return normalizeDateInput((input as any).set);
      }
      return undefined;
    };

    const dateSortie = normalizeDateInput(
      (updateMissionDto as any).date_sortie,
    );
    const dateRetour = normalizeDateInput(
      (updateMissionDto as any).date_retour,
    );
    assertMissionDuration(
      dateSortie !== undefined ? dateSortie : existing.date_sortie,
      dateRetour !== undefined ? dateRetour : existing.date_retour,
    );
    const labelToEnum: Record<string, string> = {
      'véhicule de service': 'SERVICE_CAR',
      'vehicule de service': 'SERVICE_CAR',
      'autre moyens de transport  dont les dépenses sont prises en charge par l’entreprise':
        'TRANSPORT_ENTREPRISE',
      'moyens de transport   dont les dépenses sont prises en charge par le travailleur':
        'TRANSPORT_EMPLOYEE',
      'utilisation exceptionnel du véhicule personnel, à la demande de la hiérarchie':
        'PERSONAL_CAR',
      'utilisation exceptionnelle du véhicule personnel, à la demande de la hiérarchie':
        'PERSONAL_CAR',
    };

    const mapTransport = (t: any): any => {
      if (t == null) return t;
      if (typeof t === 'string') {
        const key = t.trim().toLowerCase();
        return (labelToEnum[key] as any) || t;
      }
      if (typeof t === 'object' && 'set' in t)
        return { set: mapTransport((t as any).set) } as any;
      return t;
    };

    const {
      date_sortie: _ds,
      date_retour: _dr,
      heure_sortie: _hs, // legacy - drop
      heure_retour: _hr, // legacy - drop
      ...rest
    } = updateMissionDto as any;

    // The frozen category follows the start date: re-resolve when it moves.
    const restart =
      dateSortie && dateSortie.getTime() !== existing.date_sortie?.getTime()
        ? await this.gradeAssignments.snapshotFor(
            existing.userId,
            existing.user.category,
            dateSortie,
          )
        : null;

    return this.databaseService.mission.update({
      where: { n_mission: id },
      data: {
        ...rest,
        ...(restart
          ? {
              effectiveCategory: restart.effectiveCategory,
              gradeAssignment: restart.gradeAssignmentId
                ? { connect: { id: restart.gradeAssignmentId } }
                : { disconnect: true },
            }
          : {}),
        ...(rest.transport !== undefined
          ? { transport: mapTransport(rest.transport) }
          : {}),
        ...(dateSortie !== undefined ? { date_sortie: dateSortie } : {}),
        ...(dateRetour !== undefined ? { date_retour: dateRetour } : {}),
      },
    });
  }

  async remove(id: number, user: User) {
    // Scope first: an ADMIN only sees their structure, a USER only their own
    // (ADR 0001) — an out-of-scope id is a 404, not a hint that it exists.
    const mission = await this.databaseService.mission.findFirst({
      where: { n_mission: id, ...this.accessPolicy.scopeMissions(user) },
    });

    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    // Agents may only cancel their own ordres, and only before validation.
    if (user.role === 'USER' && mission.status === MissionStatus.COMPLETED) {
      throw new ForbiddenException('You cannot cancel this mission');
    }

    if (mission.soft_delete) {
      throw new BadRequestException(`Mission with ID ${id} is already deleted`);
    }

    return this.databaseService.mission.update({
      where: { n_mission: id },
      data: archiveStamp(user.matricule),
    });
  }
  async downloadOrdre(id: number, res: ExpressResponse, actor: User) {
    // A PDF is business data: only render it for a mission in the caller's scope.
    await this.findOne(id, actor);
    const pdf = await this.buildOrdrePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=mission-${id}.pdf`,
    });
    return res.send(pdf);
  }

  /**
   * Renders the ordre PDF. Callers must have already checked the caller's
   * scope (see downloadOrdre / create); this only builds the document.
   */
  private async buildOrdrePdf(n_mission: number): Promise<Buffer> {
    const mission = await this.databaseService.mission.findUnique({
      where: { n_mission },
      include: {
        user: { include: { structure: true } },
        gradeAssignment: { select: { kind: true } },
      },
    });
    if (!mission) {
      throw new NotFoundException(`Ordre de mission ${n_mission} introuvable.`);
    }
    try {
      return await this.pdfService.renderOrdre(toOrdrePdfData(mission));
    } catch (error) {
      this.logger.error(
        `Failed to render ordre ${n_mission}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        "Impossible de générer le PDF de l'ordre de mission.",
      );
    }
  }
}
