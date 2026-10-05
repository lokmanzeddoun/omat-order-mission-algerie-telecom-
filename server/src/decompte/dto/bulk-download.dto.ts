import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

/** Each page is rendered in one request: keep a merged PDF to a printable size. */
export const BULK_DOWNLOAD_MAX = 100;

export class BulkDownloadDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(BULK_DOWNLOAD_MAX)
  @IsInt({ each: true })
  ids: number[];
}
