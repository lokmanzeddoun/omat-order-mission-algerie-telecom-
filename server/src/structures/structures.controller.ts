import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StructuresService } from './structures.service';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Structure } from './entities/structure.entity';
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
}
