import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { DatabaseService } from 'src/database/database.service';
import {
  DecompteStatus,
  Direction,
  MissionStatus,
  TransportType,
  User,
} from '@prisma/client';
import moment from 'moment';
import * as fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import libre from 'libreoffice-convert';
import { promisify } from 'util';
import { Response as ExpressResponse } from 'express';

const convertAsync = promisify(libre.convert);
const templatePath = 'src/decompte/Template Decompte.docx';

@Injectable()
export class DecompteService {
  constructor(private readonly databaseService: DatabaseService) { }

  async create(createDecompteDto: CreateDecompteDto, id: number, user: User) {
    const mission = await this.databaseService.mission.findUnique({
      where: {
        n_mission: id,
      },
    });
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
        date_retour: moment(
          createDecompteDto.date_retour,
          'YYYY-MM-DD',
        ).toISOString(),
        heure_sortie: createDecompteDto.heure_sortie,
        heure_retour: createDecompteDto.heure_retour,
      },
    });
    // calculate the montant
    const userCategory = user.category;
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
        mission: {
          connect: { n_mission: id },
        },
      },
    });
    return this.databaseService.$transaction([updateMission, createDecomte]);
  }

  findAll(status: string) {
    console.log(status);
    // convert status to DcompteStatus
    let sat: DecompteStatus;
    if (status === 'accepted') {
      sat = DecompteStatus.ACCEPTED;
    } else if (status === 'regected') {
      sat = DecompteStatus.REGECTED;
    } else {
      sat = DecompteStatus.PENDING;
    }
    return this.databaseService.decompte.findMany({
      where: {
        soft_delete: false,
        status: sat,
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
        mission: {
          select: {
            date_retour: true,
            date_sortie: true,
            heure_retour: true,
            heure_sortie: true,
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
        mission: {
          select: {
            date_retour: true,
            date_sortie: true,
            heure_retour: true,
            heure_sortie: true,
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
      },
    });
  }

  async update(id: number, updateDecompteDto: CreateDecompteDto, user: User) {
    const decompte = await this.databaseService.decompte.findUniqueOrThrow({
      where: {
        n_decompte: id,
        soft_delete: false,
      },
      include: {
        mission: true,
      },
    });
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
        date_retour: moment(
          updateDecompteDto.date_retour,
          'YYYY-MM-DD',
        ).toISOString(),
        heure_retour: updateDecompteDto.heure_retour,
        heure_sortie: updateDecompteDto.heure_sortie,
      },
    });
    // calculate the montant
    const userCategory = user.category;
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
      },
    });
    return this.databaseService.$transaction([updateMission, updateDecompte]);
  }

  remove(id: number) {
    return this.databaseService.decompte.update({
      where: {
        n_decompte: id,
      },
      data: {
        soft_delete: true,
      },
    });
  }

  getUserDecompte(user: User) {
    return this.databaseService.decompte.findMany({
      where: {
        mission: {
          user: {
            matricule: user.matricule,
          },
        },
        soft_delete: false,
      },
    });
  }

  private fmtDate(val: any): string | null {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return moment(d).format('DD/MM/YYYY');
  }

  private getHour(val: any): string | null {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return String(d.getHours()).padStart(2, '0');
  }

  private getMinute(val: any): string | null {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return String(d.getMinutes()).padStart(2, '0');
  }

  async downloadDecompte(id: number, res: ExpressResponse) {
    // Fetch decompte with mission and user and structure
    const decompte = await this.databaseService.decompte.findUnique({
      where: { n_decompte: id },
      include: {
        mission: {
          include: {
            user: {
              include: {
                structure: true,
              },
            },
          },
        },
      },
    });

    if (!decompte) {
      throw new BadRequestException(`Decompte with ID ${id} not found.`);
    }

    const mission = decompte?.mission ?? null;
    const user = mission?.user ?? null;
    const structure = user?.structure ?? null;

    // Precompute values
    const fullanmeVal = user
      ? `${user.nom ?? ''} ${user.prenom ?? ''}`.trim() || null
      : null;
    const h_d_val = mission?.heure_sortie
      ? mission.heure_sortie.split(':')[0]
      : this.getHour(mission?.date_sortie);
    const h_r_val = mission?.heure_retour
      ? mission.heure_retour.split(':')[0]
      : this.getHour(mission?.date_retour);
    const m_d_val = mission?.heure_sortie
      ? mission.heure_sortie.split(':')[1]
      : this.getMinute(mission?.date_sortie);
    const m_r_val = mission?.heure_retour
      ? mission.heure_retour.split(':')[1]
      : this.getMinute(mission?.date_retour);
    const nbr_jour_val =
      mission?.date_sortie && mission?.date_retour
        ? Math.max(
          0,
          Math.ceil(
            (new Date(mission.date_retour).getTime() -
              new Date(mission.date_sortie).getTime()) /
            (24 * 3600 * 1000),
          ),
        )
        : null;

    // Map placeholders per instruction, null when not available
    const replacements: Record<string, any> = {
      matricule: user?.matricule ?? null,
      fullanme: fullanmeVal, // note: placeholder spelled fullanme
      post: user?.grade ?? null,
      structure: structure?.name ?? null,
      id: decompte?.n_decompte ?? null,
      date: this.fmtDate(decompte?.createdAt ?? new Date()),
      reference: mission?.n_mission ?? null,
      destination: mission?.destination ?? null,
      motif: mission?.motif ?? null,
      date_depart: this.fmtDate(mission?.date_sortie),
      date_retour: this.fmtDate(mission?.date_retour),
      h_d: h_d_val,
      h_r: h_r_val,
      m_d: m_d_val,
      m_r: m_r_val,
      nbr_jour: nbr_jour_val,
      d_parcours: decompte?.parcours ?? null,
      m_indrmnite: null, // not stored; leave null per instruction
      n_1: mission?.direction === 'NORD' ? (decompte?.repas_pec ?? null) : null,
      n_2:
        mission?.direction === 'NORD'
          ? (decompte?.hebergement_pec ?? null)
          : null,
      n_3:
        mission?.direction === 'NORD'
          ? (decompte?.repas_sans_pec ?? null)
          : null,
      n_4:
        mission?.direction === 'NORD'
          ? (decompte?.hebergement_sans_pec ?? null)
          : null,
      s_1: mission?.direction === 'SUD' ? (decompte?.repas_pec ?? null) : null,
      s_2:
        mission?.direction === 'SUD'
          ? (decompte?.hebergement_pec ?? null)
          : null,
      s_3:
        mission?.direction === 'SUD'
          ? (decompte?.repas_sans_pec ?? null)
          : null,
      s_4:
        mission?.direction === 'SUD'
          ? (decompte?.hebergement_sans_pec ?? null)
          : null,
      f_transport: null, // not stored explicitly
      m_total: decompte?.montant ?? null,
    };

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);
    doc.setData(replacements);

    try {
      doc.render();
      const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
      const pdfBuffer = await convertAsync(docxBuffer, 'pdf', undefined);
      if (pdfBuffer) {
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=decompte-${id}.pdf`,
        });
        return res.send(pdfBuffer);
      } else {
        throw new BadRequestException('something bad Happend');
      }
    } catch (e) {
      throw new BadRequestException(
        `Failed to render Template Decompte.docx: ${(e as Error).message}`,
      );
    }
  }
}
const calculateMealsAndAccommodation = (
  date_sortie: string,
  heure_sortie: string,
  date_retour: string,
  heure_retour: string,
) => {
  const start = new Date(`${date_sortie}T${heure_sortie}`);
  const end = new Date(`${date_retour}T${heure_retour}`);

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
