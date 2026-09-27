import { ApiProperty } from '@nestjs/swagger';

/** One line of the monthly décomptes recap (a month, or the period total). */
export class MonthlyRecapRowDto {
  @ApiProperty({
    description: 'Month key YYYY-MM (from Decompte.createdAt), or "total"',
  })
  month: string;

  @ApiProperty() totalCount: number;
  @ApiProperty() pendingCount: number;
  @ApiProperty() pendingAmount: number;
  @ApiProperty() acceptedCount: number;
  @ApiProperty() acceptedAmount: number;
  @ApiProperty() rejectedCount: number;
  @ApiProperty() rejectedAmount: number;
  @ApiProperty() totalAmount: number;
  @ApiProperty() feesTransport: number;
  @ApiProperty() distance: number;

  @ApiProperty({ description: 'Distinct agents with a décompte this month' })
  agents: number;
}

export class MonthlyRecapDto {
  @ApiProperty({ type: [MonthlyRecapRowDto] })
  rows: MonthlyRecapRowDto[];

  @ApiProperty({ type: MonthlyRecapRowDto })
  total: MonthlyRecapRowDto;
}
