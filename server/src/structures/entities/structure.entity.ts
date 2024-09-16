import { ApiProperty } from '@nestjs/swagger';

export class Structure {
  @ApiProperty({
    description: 'Service Code',
    nullable: false,
    required: true,
    type: 'string',
    example: '21356498752',
  })
  code: string;

  @ApiProperty({
    description: 'service name',
    nullable: false,
    required: true,
    type: 'string',
    example: 'ABO/DOT',
  })
  nom: string;
}
