import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Max, Min } from 'class-validator';

const zeroIfEmpty = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? 0 : value;

export class CreateDecompteDto {
  @IsString()
  heure_sortie: string;
  @IsString()
  date_retour: string;
  @IsString()
  heure_retour: string;
  @IsNumber()
  @Type(() => Number)
  @Transform(zeroIfEmpty, { toClassOnly: true })
  @Min(0)
  @Max(366)
  repas_pec: number = 0;
  @IsNumber()
  @Type(() => Number)
  @Transform(zeroIfEmpty, { toClassOnly: true })
  @Min(0)
  @Max(366)
  repas_sans_pec: number = 0;
  @IsNumber()
  @Type(() => Number)
  @Transform(zeroIfEmpty, { toClassOnly: true })
  @Min(0)
  @Max(366)
  hebergement_sans_pec: number = 0;
  @IsNumber()
  @Type(() => Number)
  @Transform(zeroIfEmpty, { toClassOnly: true })
  @Min(0)
  @Max(366)
  hebergement_pec: number = 0;
  @IsNumber()
  @Type(() => Number)
  @Transform(zeroIfEmpty, { toClassOnly: true })
  @Min(0)
  @Max(100000)
  parcours: number = 0;
  // Bounded so a reimbursement total can't be inflated through transport fees.
  @IsNumber()
  @Type(() => Number)
  @Transform(zeroIfEmpty, { toClassOnly: true })
  @Min(0)
  @Max(1000000)
  fees_transport: number = 0;
}
