import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../guards/auth-role.guard';
import { MfaService } from './mfa.service';
import { SessionsService } from '../sessions/sessions.service';

@Controller('users')
@ApiBearerAuth()
export class MfaAdminController {
  constructor(
    private readonly mfa: MfaService,
    private readonly sessions: SessionsService,
  ) {}

  @Post(':id/mfa/reset')
  @HttpCode(HttpStatus.OK)
  @Auth(Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      "Reset an admin's MFA (lost phone): they enroll again at next login",
  })
  async reset(@Param('id', ParseIntPipe) matricule: number) {
    await this.mfa.reset(matricule);
    await this.sessions.revokeAllForUser(matricule);
    return { message: 'MFA reset' };
  }
}
