import { IsDefined, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

const REQUIRED = { message: 'Champ obligatoire' };
const toText = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value).trim();

/** One row of the services (structures) spreadsheet. */
export class ImportStructureDto {
  @IsDefined(REQUIRED)
  @Transform(toText)
  @IsString()
  code: string;

  @IsDefined(REQUIRED)
  @Transform(toText)
  @IsString()
  name: string;
}
