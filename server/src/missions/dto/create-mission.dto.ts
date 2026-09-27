import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TransportType, Direction } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMissionDto {
  // Full ISO datetime string (e.g., 2025-10-30T14:30:00Z or local ISO)
  @ApiProperty({
    description: 'Date et heure de départ (format ISO)',
    example: '2025-11-05T08:30:00Z',
  })
  @IsDateString()
  date_sortie: string;

  @ApiPropertyOptional({
    description: 'Date et heure de retour (format ISO)',
    example: '2025-11-05T18:30:00Z',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  date_retour?: string;

  @ApiProperty({
    description: 'Motif de la mission',
    example: 'Réunion technique',
  })
  @IsString()
  motif: string;

  @ApiProperty({
    description: 'Type de transport',
    enum: TransportType,
    example: TransportType.SERVICE_CAR,
  })
  @IsEnum(TransportType, {
    message: 'transport doit être une valeur valide de TransportType',
  })
  transport: TransportType;

  @ApiProperty({
    description: 'Destination (noms de communes séparés par "-")',
    example: 'Alger-Oran',
  })
  @IsString()
  @IsNotEmpty({ message: 'La destination ne peut pas être vide' })
  @MinLength(2, {
    message: 'La destination doit contenir au moins 2 caractères',
  })
  destination: string;

  @ApiProperty({
    description: 'Direction géographique',
    enum: Direction,
    example: Direction.NORD,
  })
  @IsEnum(Direction, {
    message:
      'direction doit être une valeur valide de Direction (NORD, SUD ou MIXTE)',
  })
  direction: Direction;

  @ApiPropertyOptional({
    description: "Matricule de l'utilisateur pour lequel créer la mission",
    example: 12345,
  })
  @IsOptional()
  @IsInt() // Assuming matricule is an integer
  userMatricule: number; // Only the unique identifier, not the full User object
}
