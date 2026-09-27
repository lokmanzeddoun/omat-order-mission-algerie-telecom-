import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BaremService } from './barem.service';
import { Category, Prisma } from '@prisma/client';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { getCategoryDto } from './getByCategory.dto';
@Auth()
@Controller('barem')
export class BaremController {
  constructor(private readonly baremService: BaremService) {}

  @Post()
  @Auth('ADMIN', 'SUPER_ADMIN')
  create(@Body() createBaremDto: Prisma.BaremCreateInput) {
    return this.baremService.create(createBaremDto);
  }
  @Get()
  findAll() {
    return this.baremService.findAll();
  }
  @Get('category')
  findByCategory(@Body() body: getCategoryDto) {
    return this.baremService.findByCategory(body.libell);
  }

  @Patch(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateBaremDto: Prisma.BaremUpdateInput,
  ) {
    return this.baremService.update(+id, updateBaremDto);
  }

  @Delete(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.baremService.remove(+id);
  }
}
