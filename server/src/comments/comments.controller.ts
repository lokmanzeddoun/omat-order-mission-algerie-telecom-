import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Auth } from 'src/auth/guards/auth-role.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Endpoint to create a support comment - requires authentication
  @Auth()
  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req: any) {
    const user = req.user; // user will be populated from auth guard
    const userId = user?.matricule;
    return this.commentsService.create(dto, userId);
  }

  @Auth()
  @Get('admin')
  async listForAdmin() {
    return this.commentsService.findForAdmins();
  }
}
