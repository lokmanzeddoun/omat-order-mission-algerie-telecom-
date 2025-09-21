import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Public endpoint to create a support comment (e.g., forget-password request)
  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req: any) {
    const user = req.user; // if auth middleware present this will be populated; else client can provide userId in body
    const userId = user?.matricule ?? dto['userId'];
    return this.commentsService.create(dto, userId);
  }

  @Auth()
  @Get('admin')
  async listForAdmin() {
    return this.commentsService.findForAdmins();
  }
}
