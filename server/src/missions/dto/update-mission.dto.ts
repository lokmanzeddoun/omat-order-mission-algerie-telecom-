import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TransportType, Direction } from '@prisma/client';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/**
 * Explicit update DTO (no PartialType inheritance): it deliberately does NOT
 * carry `userMatricule`, so a mission can never be reassigned to another user
 * through an edit, and it keeps `transport`/`direction` enum-validated. The
 * service further restricts `direction` to ADMIN/SUPER_ADMIN (ADR 0001).
 */
export class UpdateMissionDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  date_sortie?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  date_retour?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  motif?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(TransportType, {
    message: 'transport doit être une valeur valide de TransportType',
  })
  transport?: TransportType;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @IsNotEmpty({ message: 'La destination ne peut pas être vide' })
  @MinLength(2, {
    message: 'La destination doit contenir au moins 2 caractères',
  })
  destination?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(Direction, {
    message: 'direction doit être une valeur valide de Direction (NORD ou SUD)',
  })
  direction?: Direction;
}
