import { Category, GradeAssignmentKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Matches } from 'class-validator';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class CreateGradeAssignmentDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsEnum(GradeAssignmentKind)
  kind: GradeAssignmentKind;

  @IsEnum(Category)
  targetCategory: Category;

  @Matches(DAY, { message: 'startDate must be YYYY-MM-DD' })
  startDate: string;

  @Matches(DAY, { message: 'endDate must be YYYY-MM-DD' })
  endDate: string;

  /** Reference of the décision that grants the period. */
  @IsString()
  @IsNotEmpty()
  decisionRef: string;
}
