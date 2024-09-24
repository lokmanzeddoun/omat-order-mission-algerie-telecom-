import {
  IS_LENGTH,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Category } from '@prisma/client';
import { Role } from '@prisma/client';
export class importUserDto {
  @IsInt()
  @IsNotEmpty()
  matricule: number;
  @IsNotEmpty()
  @IsString()
  nom: string;
  @IsNotEmpty()
  @IsString()
  prenom: string;
  @IsEmail()
  email: string;
  @IsString()
  password: string;
  @IsEnum(Role, {
    message:
      `Invalid value for 'type` +
      `Acceptable values are: ${Object.values(Role)}`,
  })
  role: Role;
  @IsString()
  @IsNotEmpty()
  grade: string;
  @IsEnum(Category, {
    message:
      `Invalid value for 'type` +
      `Acceptable values are: ${Object.values(Category)}`,
  })
  category: Category;
  @IsString()
  serviceId: string;
}
