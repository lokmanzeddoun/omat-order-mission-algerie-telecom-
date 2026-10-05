import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MoveStructureDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Code of the new parent; null makes the structure a root',
    type: 'string',
    nullable: true,
  })
  parentCode?: string | null;
}
