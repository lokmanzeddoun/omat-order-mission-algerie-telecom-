import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
} from 'class-validator';

export const BULK_MAX = 1000;

/** Ids of ordres, décomptes or users (numeric keys). */
export class BulkIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BULK_MAX)
  @IsInt({ each: true })
  ids: number[];
}

/** Codes of services (structures use a string key). */
export class BulkCodesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BULK_MAX)
  @IsString({ each: true })
  ids: string[];
}
