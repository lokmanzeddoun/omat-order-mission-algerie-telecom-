import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

const toText = ({ value }: { value: unknown }) =>
  value === undefined || value === null ? value : String(value).trim();

/**
 * One row of the services (structures) spreadsheet. A root is declared with
 * `code` + `name`; a child with its `path` ("SDC / ERSTC / Section ...").
 * Which of the two is required is checked by the service, not here.
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
  path?: string;
}
