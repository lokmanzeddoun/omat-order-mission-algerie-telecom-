import { Controller, Get, UseGuards } from '@nestjs/common';
import { ExercicesService } from './exercices.service';
import { AuthGuard } from '@nestjs/passport';
import { AllowWithTemporaryPassword } from 'src/auth/guards/password-change.guard';

@AllowWithTemporaryPassword()
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
