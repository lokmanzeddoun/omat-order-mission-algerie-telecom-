import { ApiProperty } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';
import { Category } from '@prisma/client';
export class User {
  @ApiProperty({
    description: 'User Matricule',
    nullable: false,
    required: true,
    type: 'int',
    example: '21356498752',
  })
  matricule: number;

  @ApiProperty({
    description: 'nom',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Mohamed',
  })
  nom: string;

  @ApiProperty({
    description: 'prenom',
    nullable: false,
    required: true,
    type: 'string',
    example: 'ghomari',
  })
  prenom: string;
  @ApiProperty({
    description: 'email',
    nullable: false,
    required: true,
    type: 'string',
    example: 'ghomari@gmail.com',
  })
  email: string;


  @ApiProperty({
    description: 'User Role (admin, user)',
    nullable: false,
    required: true,
    type: 'string',
    example: 'user',
  })
  role: Role;
  @ApiProperty({
    description: 'the first time he enter the platfom',
    nullable: true,
    required: false,
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  userSince?: Date;
  @ApiProperty({
    description: 'grade(Fonction)',
    nullable: false,
    required: true,
    type: 'string',
    example: 'service',
  })
  grade: string;

  @ApiProperty({
    description: 'User Category',
    nullable: false,
    required: true,
    type: 'string',
    example: 'cadre',
  })
  category: Category;
  @ApiProperty({
    description: 'Status',
    nullable: true,
    required: false,
    type: 'enum("inactive","active")',
    default: 'inactive',
    example: 'inactive',
  })
  status?: Status;
  @ApiProperty({
    description: 'soft_delete',
    nullable: true,
    required: false,
    type: 'boolean',
    default: 'false',
    example: 'false',
  })
  soft_delete?: boolean;

  @ApiProperty({
    description: 'Created At',
    nullable: true,
    required: false,
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Updated At',
    nullable: true,
    required: false,
    type: 'string',
    example: '2022-01-01T00:00:00.000Z',
  })
  updatedAt?: Date;
}
