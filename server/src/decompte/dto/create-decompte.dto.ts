import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';
import { CountColumns } from '../montant';

/** A meal or night count: a whole number, 0 when omitted. */
function Count(): PropertyDecorator {
  return (target, key) => {
    IsInt()(target, key);
    Min(0)(target, key);
    Type(() => Number)(target, key);
    Transform(
      ({ value }) => (value === undefined || value === null ? 0 : value),
      { toClassOnly: true },
    )(target, key);
  };
}

export class CreateDecompteDto implements CountColumns {
  @IsString()
  heure_sortie: string;
  @IsString()
  date_retour: string;
  @IsString()
  heure_retour: string;

  // Counts outside the ordre's Direction must stay 0 (Nord et Sud allows both).
  @Count() repas_pec_nord: number = 0;
  @Count() repas_pec_sud: number = 0;
  @Count() repas_sans_pec_nord: number = 0;
  @Count() repas_sans_pec_sud: number = 0;
  @Count() hebergement_pec_nord: number = 0;
  @Count() hebergement_pec_sud: number = 0;
  @Count() hebergement_sans_pec_nord: number = 0;
  @Count() hebergement_sans_pec_sud: number = 0;

  @IsNumber()
  @Type(() => Number) // Convert value to number if present
  @Transform(
    ({ value }) => (value === undefined || value === null ? 0 : value),
    {
      toClassOnly: true,
    },
  )
  parcours: number = 0;
  @IsNumber()
  @Type(() => Number) // Convert value to number if present
  @Transform(
    ({ value }) => (value === undefined || value === null ? 0 : value),
    {
      toClassOnly: true,
    },
  )
  fees_transport: number = 0;
}
