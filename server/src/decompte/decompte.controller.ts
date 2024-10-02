import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DecompteService } from './decompte.service';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { UpdateDecompteDto } from './dto/update-decompte.dto';

@Controller('decompte')
export class DecompteController {
  constructor(private readonly decompteService: DecompteService) {}

  @Post()
  create(@Body() createDecompteDto: CreateDecompteDto) {
    return this.decompteService.create(createDecompteDto);
  }

  @Get()
  findAll() {
    return this.decompteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.decompteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDecompteDto: UpdateDecompteDto) {
    return this.decompteService.update(+id, updateDecompteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.decompteService.remove(+id);
  }
}
