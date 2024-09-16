import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateStructureDto } from './create-structure.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStructureDto extends PartialType(CreateStructureDto) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Service name',
    type: 'string',
    example: 'AB/DOT',
  })
  name: string;
}
