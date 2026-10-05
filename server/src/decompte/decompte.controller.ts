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
import { ReopenDto } from 'src/common/dto/reopen.dto';
import { BulkAcceptDto, BulkRejectDto } from './dto/bulk-status.dto';
import { Response } from 'express';
import { BulkDownloadDto } from './dto/bulk-download.dto';
import { CreateDecomptesBulkDto } from './dto/create-decomptes-bulk.dto';

@Controller('decompte')
export class DecompteController {
  constructor(private readonly decompteService: DecompteService) {}

  // Bulk routes come first so 'bulk' is never read as an :id.
  @Patch('bulk/accept')
  @Auth('ADMIN', 'SUPER_ADMIN')
  acceptMany(@Body() body: BulkAcceptDto, @GetUser() actor: User) {
    return this.decompteService.bulkSetStatus(
      body.ids,
      'accept',
      actor,
      body.message,
    );
  }

  @Patch('bulk/reject')
  @Auth('ADMIN', 'SUPER_ADMIN')
  rejectMany(@Body() body: BulkRejectDto, @GetUser() actor: User) {
    return this.decompteService.bulkSetStatus(
      body.ids,
      'reject',
      actor,
      body.message,
    );
  }

  @Post('bulk')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  createMany(@Body() body: CreateDecomptesBulkDto, @GetUser() actor: User) {
    return this.decompteService.createMany(body.ids, body.figures, actor);
  }

  // Anyone may download what they can see; the service scopes the ids.
  @Post('bulk/download')
  @Auth()
  @UsePipes(new ValidationPipe({ transform: true }))
  downloadMany(
    @Body() body: BulkDownloadDto,
    @Res() res: Response,
    @GetUser() actor: User,
  ) {
    return this.decompteService.downloadMany(body.ids, res, actor);
  }

  @Auth('ADMIN', 'SUPER_ADMIN')
  @Post(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  create(
    @Body() createDecompteDto: CreateDecompteDto,
    @Param('id') id: string,
    @GetUser() actor: User,
  ) {
    return this.decompteService.create(createDecompteDto, +id, actor);
  }

  @Get()
  @Auth()
  findAll(
    @GetUser() actor: User,
    @Query('status') status: string,
    @Query('archive') archive: string,
    @Query('exercice') exercice?: string,
  ) {
    return this.decompteService.findAll(actor, status, archive, exercice);
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
  @Auth()
  findOne(@Param('id') id: string, @GetUser() actor: User) {
    return this.decompteService.findOne(+id, actor);
  }

  @Patch(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateDecompteDto: CreateDecompteDto,
    @GetUser() actor: User,
  ) {
    return this.decompteService.update(+id, updateDecompteDto, actor);
  }

  @Delete(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @GetUser() actor: User) {
    return this.decompteService.remove(+id, actor);
  }

  @Get(':id/download')
  @Auth()
  download(
    @Param('id') id: string,
    @Res() res: Response,
    @GetUser() actor: User,
  ) {
    return this.decompteService.downloadDecompte(+id, res, actor);
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

  @Post(':id/reopen')
  @Auth('SUPER_ADMIN')
  reopen(
    @Param('id') id: string,
    @Body() body: ReopenDto,
    @GetUser() actor: User,
  ) {
    return this.decompteService.reopen(+id, body.reason, actor);
  }
}
