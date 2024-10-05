import { IsString, IsInt, IsDate, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TransportType, User } from '@prisma/client';

export class CreateMissionDto {
  @IsDate()
  @Type(() => Date)
  date_sortie: Date;

  @IsString()
  heure_sortie: string;

  @IsDate()
  @Type(() => Date)
  date_retour: Date;

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
