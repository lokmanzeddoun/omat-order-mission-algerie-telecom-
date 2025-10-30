import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TransportType, User } from '@prisma/client';

export class CreateMissionDto {
  // Full ISO datetime string (e.g., 2025-10-30T14:30:00Z or local ISO)
  @IsDateString()
  date_sortie: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  date_retour?: string;

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
