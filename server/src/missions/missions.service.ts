import {
  BadRequestException,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
// import { CreateMissionDto } from './dto/create-mission.dto';
// import { UpdateMissionDto } from './dto/update-mission.dto';
import { DatabaseService } from 'src/database/database.service';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// import { load } from '@ /nodejs';
import moment from 'moment';
import * as fs from 'fs';
import { Prisma, User } from '@prisma/client';
import { Readable } from 'stream';
const inputFilePath = 'src/missions/TemplateOrdreDeMission.docx';
import libre from 'libreoffice-convert';
import { promisify } from 'util';
import { Response as ExpressResponse } from 'express'; // Import Express response type

// Promisify the libre.convert function
const convertAsync = promisify(libre.convert);
@Injectable()
export class MissionsService {
  constructor(private readonly databaseService: DatabaseService) {}
  async create(createMissionDto: Prisma.MissionCreateInput, user: User) {
    // save the service in database :
    const res = await this.databaseService.mission.create({
      data: {
        user: {
          connect: { matricule: user.matricule }, // Connect existing user for user1
        },
        ...createMissionDto,
        date_sortie: createMissionDto.date_sortie
          ? createMissionDto.date_sortie
          : null,
        date_retour: createMissionDto.date_retour
          ? createMissionDto.date_retour
          : null,
        transport: createMissionDto.transport || null, // Set transport to null if empty
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
    let replacements = {
      id: res.n_mission,
      date: moment().format('DD/MM/YYYY'), // e.g., "25-Jul-2024"
      fullname: `${user.nom} ${user.prenom}`, // Assuming male employee for the dummy data
      ref: user.grade,
      service: service.name,
      matricule: user.matricule,
      destination: res.Destination || '',
      date_depart: res.date_sortie || '',
      date_retour: res.date_retour || '',
      h_r: res.date_retour ? moment(res.date_retour).format('hh') : '',
      h_d: res.date_sortie ? moment(res.date_sortie).format('hh') : '',
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

  findAll() {
    return this.databaseService.mission.findMany({
      where: {
        soft_delete: false,
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
  findByUser(user: User) {
    // TODO fetch MIssion based on userId
    // return this.databaseService.mission.findUnique({
    //   where: {
    //     userId: user.matricule,
    //   },
    // });
  }

  // update(id: number, updateMissionDto: UpdateMissionDto) {
  //   return this.databaseService.mission.update({
  //     where: {
  //       n_mission: id,
  //     },
  //     data: updateMissionDto,
  //   });
  // }

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
    let replacements = {
      id: mission.n_mission,
      date: moment().format('DD/MM/YYYY'), // e.g., "25-Jul-2024"
      fullname: `${user.nom} ${user.prenom}`, // Assuming male employee for the dummy data
      ref: user.grade,
      service: service.name,
      matricule: user.matricule,
      destination: mission.Destination,
      date_depart: mission.date_sortie,
      date_retour: mission.date_retour,
      h_r: moment(mission.date_retour).format('mm') || '',
      h_d: moment(mission.date_sortie).format('hh') || '',
      m_r: moment(mission.date_retour).format('mm') || '',
      m_d: moment(mission.date_sortie).format('hh') || '',
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
