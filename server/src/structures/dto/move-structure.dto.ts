import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MoveStructureDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Code of the new parent; null makes the structure a root',
    type: 'string',
    nullable: true,
  })
  parentCode?: string | null;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Abbreviation the structure takes as a root (required when parentCode is null)',
    type: 'string',
  })
  code?: string;
}
