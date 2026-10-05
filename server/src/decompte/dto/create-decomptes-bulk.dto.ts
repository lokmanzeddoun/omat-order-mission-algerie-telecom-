import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { CreateDecompteDto } from './create-decompte.dto';

export const BULK_VALIDATE_MAX = 100;

/** Several ordres validated with the same figures (one shared form). */
export class CreateDecomptesBulkDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BULK_VALIDATE_MAX)
  @IsInt({ each: true })
  ids: number[];

  @ApiProperty({ type: CreateDecompteDto })
  @ValidateNested()
  @Type(() => CreateDecompteDto)
  figures: CreateDecompteDto;
}
