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
  DecompteStatus,
  Direction,
  MissionStatus,
  TransportType,
  User,
} from '@prisma/client';
import { Response as ExpressResponse } from 'express';
import { PdfService } from 'src/pdf/pdf.service';
import { toDecomptePdfData } from 'src/pdf/mappers/decompte.mapper';

/** Comment titles written when a décompte is accepted or rejected. */
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
  ) {}

  private async getCurrentExerciceId(): Promise<number | null> {
    await this.exercicesService.ensureCurrentForNow();
    const ex = await this.databaseService['exercice'].findFirst({
      where: { isCurrent: true },
    });
    return ex?.id ?? null;
  }

  async create(createDecompteDto: CreateDecompteDto, id: number) {
    const mission = await this.databaseService.mission.findUnique({
      where: {
        n_mission: id,
      },
      include: { user: true, _count: { select: { decompte: true } } },
    });
    if (!mission) {
      throw new NotFoundException(`Mission ${id} not found`);
    }
    if (
      mission.soft_delete ||
      mission.status !== MissionStatus.INPROGRESS ||
      mission._count.decompte > 0
    ) {
      throw new BadRequestException(
        'Seul un ordre de mission en cours, non archivé et sans décompte peut être validé',
      );
    }
    const date_sortie = mission.date_sortie.toISOString().split('T')[0];
    const date_retour = createDecompteDto.date_retour;
    const { meals, accommodations } = calculateMealsAndAccommodation(
      date_sortie,
      createDecompteDto.heure_sortie,
      date_retour,
      createDecompteDto.heure_retour,
    );
    if (
      meals !==
        createDecompteDto.repas_pec + createDecompteDto.repas_sans_pec ||
      accommodations !==
        createDecompteDto.hebergement_pec +
          createDecompteDto.hebergement_sans_pec
    ) {
      throw new BadRequestException(
        'Le nombre de repas et hebergement non valid',
      );
    }
    const updateMission = this.databaseService.mission.update({
      where: {
        n_mission: id,
      },
      data: {
        status: MissionStatus.COMPLETED,
        // Combine provided date_retour and heure_retour into a single DateTime
        date_retour: new Date(
          `${createDecompteDto.date_retour}T${createDecompteDto.heure_retour}:00`,
        ).toISOString(),
      },
    });
    // calculate the montant with the barème of the agent on the mission
    const userCategory = mission.user.category;
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

    let montant: number = 0;
    if (mission.direction === Direction.NORD) {
      montant =
        (createDecompteDto.hebergement_sans_pec +
          createDecompteDto.hebergement_pec) *
          categoryBarem.hebergement_nord +
        (createDecompteDto.repas_sans_pec + createDecompteDto.repas_pec) *
          categoryBarem.repas_nord;
    } else {
      montant =
        createDecompteDto.hebergement_sans_pec * categoryBarem.hebergement_sud +
        createDecompteDto.repas_sans_pec * categoryBarem.repas_sud;
    }
    if (mission.transport === TransportType.PERSONAL_CAR) {
      montant = montant + createDecompteDto.parcours * categoryBarem.montant_km;
    }
    // reduce 25%
    if (
      createDecompteDto.hebergement_pec > 0 ||
      createDecompteDto.repas_pec > 0
    ) {
      montant = montant * 0.25;
    }
    // Add transport fees to the total amount
    montant = montant + (createDecompteDto.fees_transport || 0);

    const exerciceId = await this.getCurrentExerciceId();
    const createDecomte = this.databaseService.decompte.create({
      data: {
        repas_pec: createDecompteDto.repas_pec,
        repas_sans_pec: createDecompteDto.repas_sans_pec,
        hebergement_pec: createDecompteDto.hebergement_pec,
        hebergement_sans_pec: createDecompteDto.hebergement_sans_pec,
        montant: montant,
        parcours: createDecompteDto.parcours
          ? createDecompteDto.parcours
          : null,
        fees_transport: createDecompteDto.fees_transport
          ? createDecompteDto.fees_transport
          : 0,
        mission: {
          connect: { n_mission: id },
        },
        ...(exerciceId ? { exercice: { connect: { id: exerciceId } } } : {}),
      },
    });
    return this.databaseService.$transaction([updateMission, createDecomte]);
  }

  async findAll(status: string, archive: string, exercice?: string) {
    console.log(status);
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
        soft_delete: softDeleteFilter,
        ...(sat ? { status: sat } : {}),
        ...(year ? { exercice: { year } } : {}),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        n_decompte: true,
        repas_pec: true,
        repas_sans_pec: true,
        hebergement_pec: true,
        hebergement_sans_pec: true,
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

  findOne(id: number) {
    return this.databaseService.decompte.findUniqueOrThrow({
      where: {
        n_decompte: id,
        soft_delete: false,
      },
      select: {
        n_decompte: true,
        repas_pec: true,
        repas_sans_pec: true,
        hebergement_pec: true,
        hebergement_sans_pec: true,
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
  }

  async update(id: number, updateDecompteDto: CreateDecompteDto) {
    const decompte = await this.databaseService.decompte.findUniqueOrThrow({
      where: {
        n_decompte: id,
        soft_delete: false,
      },
      include: {
        mission: { include: { user: true } },
      },
    });
    if (decompte.status !== DecompteStatus.PENDING) {
      throw new BadRequestException(
        'Seul un décompte en attente peut être modifié',
      );
    }
    const date_sortie = decompte.mission.date_sortie
      .toISOString()
      .split('T')[0];
    const date_retour = updateDecompteDto.date_retour;
    const { meals, accommodations } = calculateMealsAndAccommodation(
      date_sortie,
      updateDecompteDto.heure_sortie,
      date_retour,
      updateDecompteDto.heure_retour,
    );
    if (
      meals !==
        updateDecompteDto.repas_pec + updateDecompteDto.repas_sans_pec ||
      accommodations !==
        updateDecompteDto.hebergement_pec +
          updateDecompteDto.hebergement_sans_pec
    ) {
      throw new BadRequestException(
        'Le nombre de repas et hebergement non valid',
      );
    }
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
    // calculate the montant with the barème of the agent on the mission
    const userCategory = decompte.mission.user.category;
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

    let montant: number;
    if (decompte.mission.direction === Direction.NORD) {
      montant =
        (updateDecompteDto.hebergement_sans_pec +
          updateDecompteDto.hebergement_pec) *
          categoryBarem.hebergement_nord +
        (updateDecompteDto.repas_sans_pec + updateDecompteDto.repas_pec) *
          categoryBarem.repas_nord;
    } else {
      montant =
        updateDecompteDto.hebergement_sans_pec * categoryBarem.hebergement_sud +
        updateDecompteDto.repas_sans_pec * categoryBarem.repas_sud;
    }
    if (decompte.mission.transport === TransportType.PERSONAL_CAR) {
      montant = montant + updateDecompteDto.parcours * categoryBarem.montant_km;
    }
    // reduce 25%
    if (
      updateDecompteDto.hebergement_pec > 0 ||
      updateDecompteDto.repas_pec > 0
    ) {
      montant = montant * 0.25;
    }
    // Add transport fees to the total amount
    montant = montant + (updateDecompteDto.fees_transport || 0);

    const updateDecompte = this.databaseService.decompte.update({
      where: {
        soft_delete: false,
        n_decompte: id,
      },
      data: {
        repas_pec: updateDecompteDto.repas_pec,
        repas_sans_pec: updateDecompteDto.repas_sans_pec,
        hebergement_pec: updateDecompteDto.hebergement_pec,
        hebergement_sans_pec: updateDecompteDto.hebergement_sans_pec,
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

  remove(id: number, actorId: number) {
    return this.databaseService.decompte.update({
      where: {
        n_decompte: id,
      },
      data: archiveStamp(actorId),
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

  async downloadDecompte(id: number, res: ExpressResponse) {
    const decompte = await this.databaseService.decompte.findUnique({
      where: { n_decompte: id },
      include: {
        mission: { include: { user: { include: { structure: true } } } },
      },
    });
    if (!decompte) {
      throw new NotFoundException(`Décompte ${id} introuvable.`);
    }

    // Km rate of the mission owner's category, for the "Indemnité Kilométrique" line.
    const category = decompte.mission?.user?.category;
    const barem = category
      ? await this.databaseService.barem.findFirst({
          where: { libell: category },
          select: { montant_km: true },
        })
      : null;

    let pdf: Buffer;
    try {
      pdf = await this.pdfService.renderDecompte(
        toDecomptePdfData(decompte, barem),
      );
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
   * Accept a decompte (Admin only)
   * Changes status to ACCEPTED
   */
  async acceptDecompte(id: number, user: User, message?: string): Promise<any> {
    // Verify decompte exists and is in PENDING status
    const decompte = await this.databaseService.decompte.findUnique({
      where: { n_decompte: id, soft_delete: false },
      include: { mission: { include: { user: true } } },
    });

    if (!decompte) {
      throw new BadRequestException(`Decompte with ID ${id} not found.`);
    }

    if (decompte.status !== DecompteStatus.PENDING) {
      throw new BadRequestException(
        `Decompte ${id} is not in PENDING status. Current status: ${decompte.status}`,
      );
    }

    // Update decompte status to ACCEPTED
    const updatedDecompte = await this.databaseService.decompte.update({
      where: { n_decompte: id },
      data: { status: DecompteStatus.ACCEPTED },
    });

    // Optionally create a comment if a message was provided
    if (message && message.trim() !== '') {
      await this.commentsService.create(
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
    // Verify decompte exists and is in PENDING status
    const decompte = await this.databaseService.decompte.findUnique({
      where: { n_decompte: id, soft_delete: false },
      include: { mission: { include: { user: true } } },
    });

    if (!decompte) {
      throw new BadRequestException(`Decompte with ID ${id} not found.`);
    }

    if (decompte.status !== DecompteStatus.PENDING) {
      throw new BadRequestException(
        `Decompte ${id} is not in PENDING status. Current status: ${decompte.status}`,
      );
    }

    // Update decompte status to REJECTED
    const updatedDecompte = await this.databaseService.decompte.update({
      where: { n_decompte: id },
      data: { status: DecompteStatus.REGECTED },
    });

    // Create a comment with the rejection reason
    await this.commentsService.create(
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
    actorId: number,
    message?: string,
  ) {
    const text = message?.trim();
    return this.databaseService.$transaction(async (tx) => {
      const rows = await tx.decompte.findMany({
        where: { n_decompte: { in: ids } },
        select: { n_decompte: true, status: true, soft_delete: true },
      });
      const result = partitionIds(
        ids,
        new Map(rows.map((r) => [r.n_decompte, r])),
        (r) =>
          r.soft_delete
            ? 'archived'
            : r.status !== DecompteStatus.PENDING
              ? 'not_pending'
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
            userId: actorId,
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
