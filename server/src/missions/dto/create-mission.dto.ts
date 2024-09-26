import { IsString, IsInt, IsDate, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMissionDto {
  @IsDate()
  @Type(() => Date)
  date_sortie: Date;

  @IsDate()
  @Type(() => Date)
  heure_sortie: Date;

  @IsDate()
  @Type(() => Date)
  date_retour: Date;

  @IsDate()
  @Type(() => Date)
  heure_retour: Date;

  @IsString()
  motif: string;

  @IsString()
  transport: string;

  @IsString()
  destination: string;

  @IsNumber()
  montant: number;


  @IsOptional()
  @IsString()
  quality?: string;
  @IsOptional()
  @IsInt()
  responsableId: number;
}
