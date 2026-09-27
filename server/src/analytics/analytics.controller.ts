import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { User as AuthenticatedUser } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { Auth } from '../auth/guards/auth-role.guard';
import { GetUser } from '../auth/decorators/getUser.decorator';
import { MonthlyRecapDto } from './dto/monthly-recap.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Auth('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get analytics dashboard data' })
  @ApiQuery({
    name: 'exerciceId',
    required: false,
    type: Number,
    description: 'Filter by exercice ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
    type: AnalyticsResponseDto,
  })
  async getAnalytics(
    @Query('exerciceId') exerciceId?: string,
  ): Promise<AnalyticsResponseDto> {
    const parsedExerciceId = exerciceId ? parseInt(exerciceId, 10) : undefined;
    return this.analyticsService.getAnalytics(parsedExerciceId);
  }

  @Get('monthly')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Décomptes cumulated per month (scoped)' })
  @ApiQuery({ name: 'exerciceId', required: false, type: Number })
  @ApiResponse({ status: 200, type: MonthlyRecapDto })
  getMonthlyRecap(
    @GetUser() actor: AuthenticatedUser,
    @Query('exerciceId') exerciceId?: string,
  ): Promise<MonthlyRecapDto> {
    return this.analyticsService.getMonthlyRecap(
      actor,
      exerciceId ? parseInt(exerciceId, 10) : undefined,
    );
  }

  @Get('monthly/export')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Export the monthly décomptes recap to Excel' })
  @ApiQuery({ name: 'exerciceId', required: false, type: Number })
  async exportMonthlyRecap(
    @Res() res: Response,
    @GetUser() actor: AuthenticatedUser,
    @Query('exerciceId') exerciceId?: string,
  ) {
    const buffer = await this.analyticsService.exportMonthlyRecap(
      actor,
      exerciceId ? parseInt(exerciceId, 10) : undefined,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=recap-decomptes.xlsx',
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}
