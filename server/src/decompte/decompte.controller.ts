import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { DecompteService } from './decompte.service';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { AcceptDecompteDto } from './dto/accept-decompte.dto';
import { RejectDecompteDto } from './dto/reject-decompte.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { User } from '@prisma/client';
import { BulkAcceptDto, BulkRejectDto } from './dto/bulk-status.dto';
import { Response } from 'express';

@Controller('decompte')
export class DecompteController {
  constructor(private readonly decompteService: DecompteService) {}

  // Bulk routes come first so 'bulk' is never read as an :id.
  @Patch('bulk/accept')
  @Auth('ADMIN', 'SUPER_ADMIN')
  acceptMany(
    @Body() body: BulkAcceptDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.decompteService.bulkSetStatus(
      body.ids,
      'accept',
      actorId,
      body.message,
    );
  }

  @Patch('bulk/reject')
  @Auth('ADMIN', 'SUPER_ADMIN')
  rejectMany(
    @Body() body: BulkRejectDto,
    @GetUser('matricule') actorId: number,
  ) {
    return this.decompteService.bulkSetStatus(
      body.ids,
      'reject',
      actorId,
      body.message,
    );
  }

  @Auth('ADMIN', 'SUPER_ADMIN')
  @Post(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  create(
    @Body() createDecompteDto: CreateDecompteDto,
    @Param('id') id: string,
  ) {
    return this.decompteService.create(createDecompteDto, +id);
  }

  @Get()
  findAll(
    @Query('status') status: string,
    @Query('archive') archive: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.decompteService.findAll(status, archive, exercice);
  }

  @Get('user')
  @Auth()
  getUserDecompte(
    @GetUser() user: User,
    @Query('status') status: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.decompteService.getUserDecompte(user, status, exercice);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.decompteService.findOne(+id);
  }

  @Patch(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateDecompteDto: CreateDecompteDto,
  ) {
    return this.decompteService.update(+id, updateDecompteDto);
  }

  @Delete(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @GetUser('matricule') actorId: number) {
    return this.decompteService.remove(+id, actorId);
  }

  @Get(':id/download')
  @Auth()
  download(@Param('id') id: string, @Res() res: Response) {
    return this.decompteService.downloadDecompte(+id, res);
  }

  @Patch(':id/accept')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  acceptDecompte(
    @Param('id') id: string,
    @Body() acceptDecompteDto: AcceptDecompteDto,
    @GetUser() user: User,
  ) {
    return this.decompteService.acceptDecompte(
      +id,
      user,
      acceptDecompteDto.message,
    );
  }

  @Patch(':id/reject')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  rejectDecompte(
    @Param('id') id: string,
    @Body() rejectDecompteDto: RejectDecompteDto,
    @GetUser() user: User,
  ) {
    return this.decompteService.rejectDecompte(
      +id,
      user,
      rejectDecompteDto.message,
    );
  }
}
