import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateStructureDto {
  @ValidateIf((o: CreateStructureDto) => !o.parentCode)
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Abbreviation of a root structure. Ignored for a child, whose code is its full path.',
    type: 'string',
    example: 'SDC',
  })
  code?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description:
      "Structure name: the full name of a root, the structure's own path segment for a child",
    type: 'string',
    example: 'ACTEL TLEMCEN',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Code of the parent structure; omit to create a root. Depth is limited to 3 levels.',
    type: 'string',
    example: 'SDC',
  })
  parentCode?: string;
}
