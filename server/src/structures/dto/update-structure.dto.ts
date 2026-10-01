import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStructureDto {
  /** Only checked to reject an attempt to change the primary key. */
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({ description: 'Structure name', type: 'string' })
  name?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    description:
      'Matricule of the responsible (must belong to the structure); null clears it',
    type: 'number',
    nullable: true,
  })
  responsibleUserId?: number | null;
}
