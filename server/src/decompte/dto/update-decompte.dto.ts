import { PartialType } from '@nestjs/swagger';
import { CreateDecompteDto } from './create-decompte.dto';

export class UpdateDecompteDto extends PartialType(CreateDecompteDto) {}
