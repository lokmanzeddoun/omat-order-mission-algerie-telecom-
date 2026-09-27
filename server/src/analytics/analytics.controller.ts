import { Controller, Get, Query } from '@nestjs/common';
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
}
