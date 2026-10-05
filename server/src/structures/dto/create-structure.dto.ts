import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStructureDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Code of the structure (the HR "Unité org." number)',
    type: 'string',
    example: '13CA010000',
  })
  code: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Structure name, as shown everywhere (the HR "Lib long UO")',
    type: 'string',
    example: 'SDC / ACTEL TLEMCEN',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Code of the parent structure; omit to create a root. Depth is limited to 3 levels.',
    type: 'string',
    example: '13C0000000',
  })
  parentCode?: string;
}
