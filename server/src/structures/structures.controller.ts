import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpException,
  Res,
  Query,
} from '@nestjs/common';
import { StructuresService } from './structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { MoveStructureDto } from './dto/move-structure.dto';
import { User } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Structure } from './entities/structure.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, SUPPORTED_FILES } from 'src/utils/upload';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { ImportExcel } from 'src/users/dtos/import-Excel.dto';
import { Response } from 'express';
@ApiTags('Structures')
@Controller('structures')
export class StructuresController {
  constructor(private readonly structuresService: StructuresService) {}
  @ApiOperation({
    summary: 'CREATE STRUCTURE',
    description:
      'Private endpoint to Create a new Structure. It is allowed only by "admin" users, and allows the creation of strucutres with "admin" Role.',
  })
  @ApiResponse({ status: 201, description: 'Created', type: Structure })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Auth('SUPER_ADMIN')
  create(
    @Body() createStructureDto: CreateStructureDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.structuresService.create(createStructureDto, actorId);
  }

  @Get()
  findAll(@GetUser() actor: User) {
    return this.structuresService.findAll(actor);
  }

  @Get('export')
  @Auth('SUPER_ADMIN')
  @ApiOperation({
    summary: 'EXPORT STRUCTURES TO EXCEL',
    description: 'Export all structures from database to Excel file',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file downloaded successfully',
  })
  async exportStructures(@Res() res: Response) {
    return this.structuresService.exportStructures(res);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() actor: User) {
    return this.structuresService.findOne(id, actor);
  }

  @Patch(':id')
  @Auth('SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateStructureDto: UpdateStructureDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.structuresService.update(id, updateStructureDto, actorId);
  }

  @Patch(':id/move')
  @Auth('SUPER_ADMIN')
  @ApiOperation({
    summary: 'MOVE STRUCTURE',
    description:
      'Moves a structure and its subtree under another parent (or to the root). Rejects cycles and depths above 3; re-keys the codes of the subtree.',
  })
  @ApiResponse({ status: 400, description: 'Cycle or depth above 3' })
  move(
    @Param('id') id: string,
    @Body() moveStructureDto: MoveStructureDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.structuresService.move(id, moveStructureDto, actorId);
  }

  @Patch(':id/archive')
  @Auth('SUPER_ADMIN')
  @ApiOperation({
    summary: 'ARCHIVE STRUCTURE',
    description: 'Archive a structure by setting soft_delete to true',
  })
  @ApiResponse({ status: 200, description: 'Structure archived successfully' })
  @ApiResponse({ status: 404, description: 'Structure not found' })
  archive(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.structuresService.archive(id, actorId);
  }

  @Post('upload')
  @Auth('SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser('matricule') actorId: number,
    @Query('dryRun') dryRun?: string,
  ) {
    if (!file) {
      throw new HttpException(
        `Please provide correct file name with extension ${JSON.stringify(SUPPORTED_FILES)}`,
        400,
      );
    }
    const importStructure: ImportExcel = {
      originalname: file.originalname, // Add necessary fields to match ArquivoImportacao DTO
      buffer: file.buffer, // Store the file buffer to process the Excel file
    };
    // file is the uploaded file
    return this.structuresService.uploadStructure(importStructure, {
      dryRun: dryRun === 'true' || dryRun === '1',
      actorId,
    });
  }
}
