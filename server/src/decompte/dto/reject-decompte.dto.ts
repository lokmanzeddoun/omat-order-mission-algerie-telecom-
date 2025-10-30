import { IsNotEmpty, IsString } from 'class-validator';

export class RejectDecompteDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}
