import {
  BadRequestException,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
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
    const res = await this.databaseService.mission.create({
      data: {
        ...createMissionDto,
        // userId: userData.matricule,
        date_sortie: createMissionDto.date_sortie
          ? moment.utc(createMissionDto.date_sortie, 'YYYY-MM-DD').toDate()
          : null,
        date_retour: createMissionDto.date_retour
          ? moment.utc(createMissionDto.date_retour, 'YYYY-MM-DD').toDate()
          : null,
        transport: createMissionDto.transport || null, // Set transport to null if empty
        user: {
          connect: { matricule: user.matricule },
        },
        ...(exerciceId ? { exercice: { connect: { id: exerciceId } } } : {}),
      },
    });
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
      id: res.n_mission,
      date: moment().format('DD/MM/YYYY'), // e.g., "25-Jul-2024"
      fullname: `${user.nom} ${user.prenom}`, // Assuming male employee for the dummy data
      ref: user.grade,
      service: service.name,
      matricule: user.matricule,
      destination: res.destination || '',
      date_depart: res.date_sortie
        ? moment(res.date_sortie).format('DD/MM/YYYY')
        : '',
      date_retour: res.date_retour
        ? moment(res.date_retour).format('DD/MM/YYYY')
        : '',
      h_r: res.heure_retour ? res.heure_retour.split(':')[0] : '',
      h_d: res.heure_sortie ? res.heure_sortie.split(':')[0] : '',
      m_r: res.heure_retour ? res.heure_retour.split(':')[1] : '',
      m_d: res.heure_sortie ? res.heure_sortie.split(':')[1] : '',
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
    let missionStatus: MissionStatus;
    if (status === 'completed') missionStatus = MissionStatus.COMPLETED;
    else missionStatus = MissionStatus.INPROGRESS;
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
        status: missionStatus,
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
        heure_sortie: true,
        date_retour: true,
        heure_retour: true,
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
    let missionStatus: MissionStatus;
    if (status === 'completed') missionStatus = MissionStatus.COMPLETED;
    else missionStatus = MissionStatus.INPROGRESS;
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
        status: missionStatus,
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
        heure_sortie: true,
        date_retour: true,
        heure_retour: true,
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
    return this.databaseService.mission.update({
      where: {
        n_mission: id,
      },
      data: {
        ...updateMissionDto,
        date_sortie:
          typeof updateMissionDto.date_sortie === 'string'
            ? moment.utc(updateMissionDto.date_sortie, 'YYYY-MM-DD').toDate()
            : updateMissionDto.date_sortie instanceof Date
              ? updateMissionDto.date_sortie
              : null,
        date_retour:
          typeof updateMissionDto.date_retour === 'string'
            ? moment.utc(updateMissionDto.date_retour, 'YYYY-MM-DD').toDate()
            : updateMissionDto.date_retour instanceof Date
              ? updateMissionDto.date_retour
              : null,
      },
    });
  }

  remove(id: number) {
    return this.databaseService.mission.update({
      where: {
        n_mission: id,
      },
      data: {
        soft_delete: true,
      },
    });
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
      h_r: mission.heure_retour ? mission.heure_retour.split(':')[0] : '',
      h_d: mission.heure_sortie ? mission.heure_sortie.split(':')[0] : '',
      m_r: mission.heure_retour ? mission.heure_retour.split(':')[1] : '',
      m_d: mission.heure_sortie ? mission.heure_sortie.split(':')[1] : '',
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
