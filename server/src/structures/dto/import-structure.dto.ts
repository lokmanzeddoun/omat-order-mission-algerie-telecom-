import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

const toText = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value).trim();

/**
 * One row of the structures spreadsheet: `code` ("Unité org."), `name`
 * ("Lib long UO") and an optional `parentCode` (otherwise implied by the code).
 * Required cells are checked by the service, not here.
 */
export class ImportStructureDto {
  @IsOptional()
  @Transform(toText)
  @IsString()
  code?: string;

  @IsOptional()
  @Transform(toText)
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(toText)
  @IsString()
  parentCode?: string;
}
