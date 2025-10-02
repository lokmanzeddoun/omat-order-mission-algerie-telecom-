import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransportType, User } from '@prisma/client';

export class CreateMissionDto {
  @IsDateString()
  date_sortie: string;

  @IsString()
  heure_sortie: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  date_retour?: string;

  @IsString()
  heure_retour: string;

  @IsString()
  motif: string;

  @IsString()
  transport: TransportType;

  @IsString()
  destination: string;

  @IsOptional()
  @IsInt() // Assuming matricule is an integer
  userMatricule: number; // Only the unique identifier, not the full User object
}
