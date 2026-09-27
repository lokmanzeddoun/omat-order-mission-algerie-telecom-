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
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User as AuthenticatedUser } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createUserDto } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, SUPPORTED_FILES } from 'src/utils/upload';
import { ImportExcel } from './dtos/import-Excel.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { Response } from 'express';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

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
  @Auth('ADMIN', 'SUPER_ADMIN')
  create(
    @Body() createUserDto: createUserDto,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.create(createUserDto, actor);
  }

  @Post('upload')
  @Auth('SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file', multerOptions))
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
    return this.usersService.uploadUsers(importUsers);
  }

  @Get('export')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'EXPORT USERS TO EXCEL',
    description: 'Export all users from database to Excel file',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file downloaded successfully',
  })
  async exportUsers(
    @Res() res: Response,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.exportUsers(res, actor);
  }

  @Get()
  @Auth('ADMIN', 'SUPER_ADMIN')
  findAll(@GetUser() actor: AuthenticatedUser) {
    return this.usersService.findAll(actor);
  }

  @Get(':id')
  @Auth()
  findOne(
    @Param('id') id: string,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.findOne(+id, actor);
  }
  @Get(':id/service')
  @Auth('ADMIN', 'SUPER_ADMIN')
  findUserService(
    @Param('id') id: string,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.findUsersInService(+id, actor);
  }

  @Patch(':id')
  @Auth('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(+id, updateUserDto, actor);
  }

  @Patch(':id/archive')
  @Auth('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'ARCHIVE USER',
    description: 'Archive a user by setting soft_delete to true',
  })
  @ApiResponse({ status: 200, description: 'User archived successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  archive(
    @Param('id') id: string,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.archive(+id, actor);
  }
  // Admin-only endpoint to reset a user's password
  @Auth('ADMIN', 'SUPER_ADMIN')
  @Post(':id/reset-password')
  @ApiOperation({
    summary: 'RESET USER PASSWORD',
    description: 'Admin can reset a user password by providing a new password',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @GetUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.resetPassword(
      +id,
      resetPasswordDto.newPassword,
      actor,
    );
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
