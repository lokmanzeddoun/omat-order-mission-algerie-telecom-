import { Injectable } from '@nestjs/common';
import { CreateDecompteDto } from './dto/create-decompte.dto';
import { UpdateDecompteDto } from './dto/update-decompte.dto';

@Injectable()
export class DecompteService {
  create(createDecompteDto: CreateDecompteDto) {
    return 'This action adds a new decompte';
  }

  findAll() {
    return `This action returns all decompte`;
  }

  findOne(id: number) {
    return `This action returns a #${id} decompte`;
  }

  update(id: number, updateDecompteDto: UpdateDecompteDto) {
    return `This action updates a #${id} decompte`;
  }

  remove(id: number) {
    return `This action removes a #${id} decompte`;
  }
}
