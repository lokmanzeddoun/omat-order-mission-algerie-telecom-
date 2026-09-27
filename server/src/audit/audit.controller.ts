import { Controller, Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Auth('ADMIN', 'SUPER_ADMIN')
  list(@GetUser() actor: User) {
    return this.audit.list(actor);
  }
}
