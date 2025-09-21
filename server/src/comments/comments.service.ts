import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateCommentDto, userId?: number) {
    // If userId not provided, try to find by email (allowing unauthenticated users to submit email)
    let user;
    if (userId) {
      user = await this.databaseService.user.findUnique({
        where: { matricule: userId },
      });
    } else if (dto.email) {
      user = await this.databaseService.user.findUnique({
        where: { email: dto.email },
      });
    }
    if (!user)
      throw new BadRequestException(
        'User not found. Provide a valid email or authenticate.',
      );

    // Prevent multiple pending forget-password requests per user
    if (dto.type === 'FORGET_PASSWORD') {
      const existing = await this.databaseService.commentaire.findFirst({
        where: {
          userId: user.matricule,
          type: 'FORGET_PASSWORD',
          status: 'PENDING',
          soft_delete: false,
        },
      });
      if (existing)
        throw new BadRequestException(
          'A pending password reset request already exists for this user.',
        );
    }

    const data: any = {
      title: dto.title,
      type: dto.type,
      status: dto.status ?? 'PENDING',
      user: { connect: { matricule: user.matricule } },
      ...(dto.decompteId
        ? { decompte: { connect: { n_decompte: dto.decompteId } } }
        : {}),
    };

    return this.databaseService.commentaire.create({ data });
  }

  async findForAdmins() {
    // simple finder for admins: all non-soft-deleted comments
    return this.databaseService.commentaire.findMany({
      where: { soft_delete: false },
      orderBy: { createdAt: 'desc' },
    });
  }
}
