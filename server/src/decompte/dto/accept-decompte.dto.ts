import { IsOptional, IsString } from 'class-validator';

export class AcceptDecompteDto {
  @IsOptional()
  @IsString()
  message?: string;
}
