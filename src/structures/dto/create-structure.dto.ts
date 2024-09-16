import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStructureDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Structure Code',
    default: '1234',
    type: 'string',
    example: '1234',
  })
  code: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Service name',
    type: 'string',
    example: 'AB/DOT',
  })
  name: string;
}
