import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category } from '@prisma/client';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
export class createUserDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User Matricule',
    default: 1234,
    type: 'number',
    example: 1234,
  })
  matricule: number;
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'User familyName',
    default: 'ghomari',
    type: 'string',
    example: 'ghomari',
  })
  nom: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'User name',
    default: 'mohammed',
    type: 'string',
    example: 'mohammed',
  })
  prenom: string;
  @ApiProperty({
    description: 'User Role (super_admin,admin, user)',
    default: 'user',
    type: 'string',
    example: 'USER',
  })
  @IsEnum(Role, {
    message:
      `Invalid value for 'type` +
      `Acceptable values are: ${Object.values(Role)}`,
  })
  role: Role;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User Fonction(Grade)',
    type: 'string',
    example: 'service',
  })
  grade: string;
  @IsEnum(Category, {
    message:
      `Invalid value for 'type` +
      `Acceptable values are: ${Object.values(Category)}`,
  })
  @ApiProperty({
    description: 'User Category (cadre,cadre_superieure, execution_maitrise)',
    type: 'string',
    example: 'CADRE',
  })
  category: Category;
  @ApiProperty({
    description: 'Structure code',
    type: 'string',
    example: '1A',
  })
  @IsOptional()
  @IsString()
  serviceId: string;
}
