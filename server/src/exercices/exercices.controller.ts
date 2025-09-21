import { Controller, Get, UseGuards } from '@nestjs/common';
import { ExercicesService } from './exercices.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('exercices')
export class ExercicesController {
  constructor(private readonly exercices: ExercicesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  list() {
    return this.exercices.list();
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'))
  current() {
    return this.exercices.getCurrent();
  }
}
