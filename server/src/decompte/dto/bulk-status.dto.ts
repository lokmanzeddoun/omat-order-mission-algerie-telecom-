import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BulkIdsDto } from 'src/archive/dto/bulk-ids.dto';

export class BulkAcceptDto extends BulkIdsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class BulkRejectDto extends BulkIdsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
