import { Controller, Post, Body, Get } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';
import { GetUser } from 'src/auth/decorators/getUser.decorator';
import { User } from '@prisma/client';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Create a support comment / ticket. Authorship comes from the token, never
  // the body; status is server-controlled (ADR 0001).
  @Auth()
  @Post()
  async create(@Body() dto: CreateCommentDto, @GetUser() actor: User) {
    return this.commentsService.create(dto, actor);
  }

  // Support inbox: staff only, scoped to the admin's structure.
  @Auth('ADMIN', 'SUPER_ADMIN')
  @Get('admin')
  async listForAdmin(@GetUser() actor: User) {
    return this.commentsService.findForAdmins(actor);
  }
}
