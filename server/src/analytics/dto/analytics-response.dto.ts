import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsKPIDto {
  @ApiProperty({ description: 'Total number of missions' })
  totalMissions: number;

  @ApiProperty({ description: 'Total number of completed missions' })
  completedMissions: number;

  @ApiProperty({ description: 'Total number of in-progress missions' })
  inProgressMissions: number;

  @ApiProperty({ description: 'Total number of decomptes' })
  totalDecomptes: number;

  @ApiProperty({ description: 'Total number of accepted decomptes' })
  acceptedDecomptes: number;

  @ApiProperty({ description: 'Total number of pending decomptes' })
  pendingDecomptes: number;

  @ApiProperty({ description: 'Total number of rejected decomptes' })
  rejectedDecomptes: number;

  @ApiProperty({ description: 'Total amount of all decomptes' })
  totalAmount: number;

  @ApiProperty({ description: 'Total amount of accepted decomptes' })
  acceptedAmount: number;

  @ApiProperty({ description: 'Total amount of pending decomptes' })
  pendingAmount: number;

  @ApiProperty({ description: 'Average decompte amount' })
  averageDecompteAmount: number;

  @ApiProperty({ description: 'Total number of active users' })
  activeUsers: number;
}

export class StatusDistributionDto {
  @ApiProperty({ description: 'Status name' })
  status: string;

  @ApiProperty({ description: 'Count of items with this status' })
  count: number;

  @ApiProperty({ description: 'Percentage of total' })
  percentage: number;
}

export class MonthlyTrendDto {
  @ApiProperty({ description: 'Month (YYYY-MM format)' })
  month: string;

  @ApiProperty({ description: 'Count of missions' })
  missionCount: number;

  @ApiProperty({ description: 'Count of decomptes' })
  decompteCount: number;

  @ApiProperty({ description: 'Total amount for the month' })
  totalAmount: number;
}

export class CategoryBreakdownDto {
  @ApiProperty({ description: 'Category name' })
  category: string;

  @ApiProperty({ description: 'Count of missions' })
  missionCount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Average amount' })
  averageAmount: number;
}

export class DirectionBreakdownDto {
  @ApiProperty({ description: 'Direction (NORD/SUD)' })
  direction: string;

  @ApiProperty({ description: 'Count of missions' })
  missionCount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;
}

export class TransportBreakdownDto {
  @ApiProperty({ description: 'Transport type' })
  transportType: string;

  @ApiProperty({ description: 'Count of missions' })
  count: number;

  @ApiProperty({ description: 'Percentage of total' })
  percentage: number;
}

export class TopDestinationDto {
  @ApiProperty({ description: 'Destination name' })
  destination: string;

  @ApiProperty({ description: 'Number of missions to this destination' })
  count: number;
}

export class AnalyticsResponseDto {
  @ApiProperty({ description: 'Key performance indicators' })
  kpis: AnalyticsKPIDto;

  @ApiProperty({
    description: 'Mission status distribution',
    type: [StatusDistributionDto],
  })
  missionStatusDistribution: StatusDistributionDto[];

  @ApiProperty({
    description: 'Decompte status distribution',
    type: [StatusDistributionDto],
  })
  decompteStatusDistribution: StatusDistributionDto[];

  @ApiProperty({
    description: 'Monthly trends over the last 12 months',
    type: [MonthlyTrendDto],
  })
  monthlyTrends: MonthlyTrendDto[];

  @ApiProperty({
    description: 'Breakdown by category',
    type: [CategoryBreakdownDto],
  })
  categoryBreakdown: CategoryBreakdownDto[];

  @ApiProperty({
    description: 'Breakdown by direction',
    type: [DirectionBreakdownDto],
  })
  directionBreakdown: DirectionBreakdownDto[];

  @ApiProperty({
    description: 'Breakdown by transport type',
    type: [TransportBreakdownDto],
  })
  transportBreakdown: TransportBreakdownDto[];

  @ApiProperty({
    description: 'Top 10 destinations',
    type: [TopDestinationDto],
  })
  topDestinations: TopDestinationDto[];
}
