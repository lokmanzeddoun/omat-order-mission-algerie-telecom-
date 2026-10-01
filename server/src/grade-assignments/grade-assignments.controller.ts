import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { GradeAssignmentsService } from './grade-assignments.service';
import { CreateGradeAssignmentDto } from './dto/create-grade-assignment.dto';
import { EndGradeAssignmentDto } from './dto/end-grade-assignment.dto';

/** Interim / Remplaçant periods: super admin only (CONTEXT.md). */
@Controller('grade-assignments')
export class GradeAssignmentsController {
  constructor(private readonly service: GradeAssignmentsService) {}

  @Get()
  @Auth('SUPER_ADMIN')
  list(@Query('userId') userId?: string) {
    const id = userId ? Number(userId) : undefined;
    return this.service.list(Number.isInteger(id) ? id : undefined);
  }

  @Post()
  @Auth('SUPER_ADMIN')
  create(@Body() dto: CreateGradeAssignmentDto, @GetUser() actor: User) {
    return this.service.create(dto, actor);
  }

  @Patch(':id/end')
  @Auth('SUPER_ADMIN')
  end(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndGradeAssignmentDto,
    @GetUser() actor: User,
  ) {
    return this.service.end(id, actor, dto.reason);
  }
}
