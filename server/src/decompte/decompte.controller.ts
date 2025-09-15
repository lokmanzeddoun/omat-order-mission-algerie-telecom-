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
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { User } from '@prisma/client';
import { Response } from 'express';

@Controller('decompte')
export class DecompteController {
  constructor(private readonly decompteService: DecompteService) { }

  @Auth()
  @Post(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  create(
    @Body() createDecompteDto: CreateDecompteDto,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.decompteService.create(createDecompteDto, +id, user);
  }

  @Get()
  findAll(@Query('status') status: string) {
    return this.decompteService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.decompteService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDecompteDto: CreateDecompteDto,
    @GetUser() user: User,
  ) {
    return this.decompteService.update(+id, updateDecompteDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.decompteService.remove(+id);
  }
  @Get('user')
  getUserDecompte(@GetUser() user: User) {
    this.decompteService.getUserDecompte(user);
  }

  @Get(':id/download')
  @Auth()
  download(@Param('id') id: string, @Res() res: Response) {
    return this.decompteService.downloadDecompte(+id, res);
  }
}
