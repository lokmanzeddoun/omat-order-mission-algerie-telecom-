import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Category } from '@prisma/client';

const REQUIRED = { message: 'Champ obligatoire' };
const toText = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value).trim();
const toUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

/** Importable user fields. Role and password columns are deliberately ignored. */
export class ImportUserRowDto {
  @IsDefined(REQUIRED)
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d+$/.test(value.trim())
      ? Number(value)
      : value,
  )
  @IsInt({ message: 'Le matricule doit être un nombre entier' })
  @IsPositive({ message: 'Le matricule doit être positif' })
  matricule: number;

  @IsDefined(REQUIRED)
  @Transform(toText)
  @IsString()
  nom: string;

  @IsDefined(REQUIRED)
  @Transform(toText)
  @IsString()
  prenom: string;

  @IsDefined(REQUIRED)
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsDefined(REQUIRED)
  @Transform(toUpper)
  @IsEnum(Category, {
    message: `Catégorie invalide (valeurs acceptées : ${Object.values(Category).join(', ')})`,
  })
  category: Category;

  @IsDefined(REQUIRED)
  @Transform(toText)
  @IsString()
  grade: string;

  @IsOptional()
  @Transform(toText)
  @IsString()
  serviceId?: string;
}
