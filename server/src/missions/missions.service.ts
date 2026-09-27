import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { archiveStamp } from 'src/archive/archive-stamp';
import { ExercicesService } from 'src/exercices/exercices.service';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// import { load } from '@ /nodejs';
import moment from 'moment';
import * as fs from 'fs';
import { MissionStatus, Prisma, User } from '@prisma/client';
import { Readable } from 'stream';
const inputFilePath = 'src/missions/TemplateOrdreDeMission.docx';
import libre from 'libreoffice-convert';
import { promisify } from 'util';
import { Response as ExpressResponse } from 'express'; // Import Express response type

// Promisify the libre.convert function
const convertAsync = promisify(libre.convert);
@Injectable()
export class MissionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly exercicesService: ExercicesService,
  ) {}
  private async getCurrentExerciceId(): Promise<number | null> {
    await this.exercicesService.ensureCurrentForNow();
    const ex = await this.databaseService['exercice'].findFirst({
      where: { isCurrent: true },
    });
    return ex?.id ?? null;
  }
  async create(createMissionDto: Prisma.MissionCreateInput, user: User) {
    console.log(createMissionDto);
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
      // Optionally, ensure the target user exists
      const exists = await this.databaseService.user.findUnique({
        where: { matricule: candidateMatricule },
        select: { matricule: true },
      });
      if (!exists) {
        throw new BadRequestException(
          `Target user with matricule ${candidateMatricule} not found`,
        );
      }
      targetMatricule = candidateMatricule;
    }
    const res = await this.databaseService.mission.create({
      data: {
        ...cleanDto,
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
    // Use the target user's information for document generation
    const pdfUser =
      targetMatricule === user.matricule
        ? user
        : await this.databaseService.user.findUnique({
            where: { matricule: targetMatricule },
          });
    const service = await this.databaseService.structure.findUnique({
      where: {
        code: pdfUser?.serviceId,
      },
      select: {
        name: true,
      },
    });
    const content = fs.readFileSync(inputFilePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);
    const replacements = {
      id: res.n_mission,
      date: moment().format('DD/MM/YYYY'), // e.g., "25-Jul-2024"
      fullname: `${pdfUser?.nom ?? ''} ${pdfUser?.prenom ?? ''}`,
      ref: pdfUser?.grade,
      service: service?.name,
      matricule: pdfUser?.matricule,
      destination: res.destination || '',
      date_depart: res.date_sortie
        ? moment(res.date_sortie).format('DD/MM/YYYY')
        : '',
      date_retour: res.date_retour
        ? moment(res.date_retour).format('DD/MM/YYYY')
        : '',
      h_r: res.date_retour ? moment(res.date_retour).format('HH') : '',
      h_d: res.date_sortie ? moment(res.date_sortie).format('HH') : '',
      m_r: res.date_retour ? moment(res.date_retour).format('mm') : '',
      m_d: res.date_sortie ? moment(res.date_sortie).format('mm') : '',
    };
    // Set the template variables
    doc.setData(replacements);

    try {
      // Render the document
      doc.render();

      // Generate the output file
      const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
      const pdfBuffer = await convertAsync(docxBuffer, 'pdf', undefined);

      // Create a readable stream from the PDF buffer
      if (pdfBuffer) {
        const stream = new Readable();
        stream.push(pdfBuffer);
        stream.push(null); // End the stream
        // Return the PDF as a downloadable streamable file
        return new StreamableFile(stream, {
          disposition: `attachment; filename=mission-${res.n_mission}.pdf`,
          type: 'application/pdf', // Correct MIME type for PDF
        });
      } else {
        throw new BadRequestException('something bad Happend');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  async findAll(delete_status: string, status: string, exercice?: string) {
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

  findOne(id: number) {
    return this.databaseService.mission.findUnique({
      where: {
        n_mission: id,
      },
    });
  }
  async findByUser(
    user: User,
    delete_status: string,
    status: string,
    exercice?: string,
  ) {
    // console.log()
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

  update(id: number, updateMissionDto: Prisma.MissionUpdateInput) {
    // Normalize possible Prisma update inputs for date fields.
    console.log(updateMissionDto);
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

    return this.databaseService.mission.update({
      where: { n_mission: id },
      data: {
        ...rest,
        ...(rest.transport !== undefined
          ? { transport: mapTransport(rest.transport) }
          : {}),
        ...(dateSortie !== undefined ? { date_sortie: dateSortie } : {}),
        ...(dateRetour !== undefined ? { date_retour: dateRetour } : {}),
      },
    });
  }

  async remove(id: number, user: User) {
    try {
      const mission = await this.databaseService.mission.findUnique({
        where: { n_mission: id },
      });

      if (!mission) {
        throw new BadRequestException(`Mission with ID ${id} not found`);
      }

      // Agents may only cancel their own ordres, and only before validation.
      if (
        user.role === 'USER' &&
        (mission.userId !== user.matricule ||
          mission.status === MissionStatus.COMPLETED)
      ) {
        throw new ForbiddenException('You cannot cancel this mission');
      }

      if (mission.soft_delete) {
        throw new BadRequestException(
          `Mission with ID ${id} is already deleted`,
        );
      }

      return await this.databaseService.mission.update({
        where: {
          n_mission: id,
        },
        data: archiveStamp(user.matricule),
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete mission: ${error.message}`,
      );
    }
  }
  async downloadOrdre(id: number, user: User, res: ExpressResponse) {
    const mission = await this.databaseService.mission.findUnique({
      where: {
        n_mission: id,
      },
    });
    // Handle case where the mission is not found
    if (!mission) {
      throw new BadRequestException(`Mission with ID ${id} not found.`);
    }
    const service = await this.databaseService.structure.findUnique({
      where: {
        code: user.serviceId,
      },
      select: {
        name: true,
      },
    });
    const content = fs.readFileSync(inputFilePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);
    const replacements = {
      id: mission.n_mission,
      date: moment().format('DD/MM/YYYY'), // e.g., "25-Jul-2024"
      fullname: `${user.nom} ${user.prenom}`, // Assuming male employee for the dummy data
      ref: user.grade,
      service: service.name,
      matricule: user.matricule,
      destination: mission.destination,
      date_depart: mission.date_sortie
        ? moment(mission.date_sortie).format('DD/MM/YYYY')
        : '',
      date_retour: mission.date_retour
        ? moment(mission.date_retour).format('DD/MM/YYYY')
        : '',
      h_r: mission.date_retour ? moment(mission.date_retour).format('HH') : '',
      h_d: mission.date_sortie ? moment(mission.date_sortie).format('HH') : '',
      m_r: mission.date_retour ? moment(mission.date_retour).format('mm') : '',
      m_d: mission.date_sortie ? moment(mission.date_sortie).format('mm') : '',
      wilaya: 'Tlemcen',
    };
    // Set the template variables
    doc.setData(replacements);

    try {
      // Render the document
      doc.render();

      // Generate the output file
      const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
      const pdfBuffer = await convertAsync(docxBuffer, 'pdf', undefined);

      // Create a readable stream from the PDF buffer
      if (pdfBuffer) {
        // Set the headers to force a download
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=mission-${id}.pdf`,
        });
        return res.send(pdfBuffer);
      } else {
        throw new BadRequestException('something bad Happend');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
}
