import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createUserDto } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, SUPPORTED_FILES } from 'src/utils/upload';
import { ImportExcel } from './dtos/import-Excel.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { GetUser } from 'src/auth/decorators/getUser.decorator';

@ApiTags('User')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @ApiOperation({
    summary: 'CREATE USER',
    description:
      'Private endpoint to Create a new User. It is allowed only by "admin" users, and allows the creation of users with "admin" Role.',
  })
  @ApiResponse({ status: 201, description: 'Created', type: User })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })
  @Post()
  create(@Body() createUserDto: createUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException(
        `Please provide correct file name with extension ${JSON.stringify(SUPPORTED_FILES)}`,
        400,
      );
    }
    const importUsers: ImportExcel = {
      originalname: file.originalname, // Add necessary fields to match ArquivoImportacao DTO
      buffer: file.buffer, // Store the file buffer to process the Excel file
    };
    // file is the uploaded file
    this.usersService.uploadUsers(file);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }
  @Get(':id/service')
  findUserService(@Param('id') id: string) {
    return this.usersService.findUsersInService(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Prisma.UserCreateInput,
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
  @Auth()
  @Post('/changePassword')
  changePassword(
    @Body() changePasswod: ChangePasswordDto,
    @GetUser() user: User,
  ) {
    return this.usersService.ChangePassword(changePasswod, user.matricule);
  }
}
