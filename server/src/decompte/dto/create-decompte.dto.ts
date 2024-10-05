import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsDecimal,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDecompteDto {
  @IsString()
  heure_sortie: string;
  @IsString()
  date_retour: string;
  @IsString()
  heure_retour: string;
  @IsNumber()
  @Type(() => Number) // Convert value to number if present
  @Transform(({ value }) => (value === undefined ? 0 : value), {
    toClassOnly: true,
  })
  repas_pec: number = 0;
  @IsNumber()
  @Type(() => Number) // Convert value to number if present
  @Transform(({ value }) => (value === undefined ? 0 : value), {
    toClassOnly: true,
  })
  repas_sans_pec: number = 0;
  @IsNumber()
  @Type(() => Number) // Convert value to number if present
  @Transform(({ value }) => (value === undefined ? 0 : value), {
    toClassOnly: true,
  })
  hebergement_sans_pec: number = 0;
  @IsNumber()
  @Type(() => Number) // Convert value to number if present
  @Transform(({ value }) => (value === undefined ? 0 : value), {
    toClassOnly: true,
  })
  hebergement_pec: number = 0;
  @IsOptional()
  @IsDecimal()
  parcours: number;
}
