import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpException,
  Res,
} from '@nestjs/common';
import { StructuresService } from './structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Structure } from './entities/structure.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { SUPPORTED_FILES } from 'src/utils/upload';
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
  create(@Body() createStructureDto: CreateStructureDto) {
    return this.structuresService.create(createStructureDto);
  }

  @Get()
  findAll() {
    return this.structuresService.findAll();
  }

  @Get('export')
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
  findOne(@Param('id') id: string) {
    return this.structuresService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStructureDto: UpdateStructureDto,
  ) {
    return this.structuresService.update(id, updateStructureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.structuresService.remove(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
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
    this.structuresService.uploadStructure(importStructure);
  }
}
