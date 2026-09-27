import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MessageType, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { AccessPolicy } from 'src/common/policy/access-policy';
import { CreateCommentDto } from './dto/create-comment.dto';

/** A status comment the system writes when a décompte is accepted/rejected. */
interface StatusComment {
  title: string;
  type: MessageType;
  status: string;
  decompteId: number;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accessPolicy: AccessPolicy,
  ) {}

  /**
   * A user opens a support ticket, or comments on a décompte they can see.
   * Authorship is the authenticated actor (never a body-supplied id/email) and
   * the status is server-controlled, so neither can be spoofed (ADR 0001).
   */
  async create(dto: CreateCommentDto, actor: User) {
    // A comment tied to a décompte is only allowed on one the actor may see.
    if (dto.decompteId != null) {
      const visible = await this.databaseService.decompte.findFirst({
        where: {
          n_decompte: dto.decompteId,
          ...this.accessPolicy.scopeDecomptes(actor),
        },
        select: { n_decompte: true },
      });
      if (!visible) {
        throw new NotFoundException(`Décompte ${dto.decompteId} introuvable.`);
      }
    }

    // One pending password-reset request per user.
    if (dto.type === MessageType.FORGET_PASSWORD) {
      const existing = await this.databaseService.commentaire.findFirst({
        where: {
          userId: actor.matricule,
          type: MessageType.FORGET_PASSWORD,
          status: 'PENDING',
          soft_delete: false,
        },
      });
      if (existing) {
        throw new BadRequestException(
          'A pending password reset request already exists for this user.',
        );
      }
    }

    return this.databaseService.commentaire.create({
      data: {
        title: dto.title,
        type: dto.type,
        // Never trust a client-set status: a new comment always starts PENDING.
        status: 'PENDING',
        user: { connect: { matricule: actor.matricule } },
        ...(dto.decompteId
          ? { decompte: { connect: { n_decompte: dto.decompteId } } }
          : {}),
      },
    });
  }

  /**
   * Trusted, internal write used when a décompte is accepted/rejected. The
   * caller (DecompteService) has already authorized the action and sets the
   * status; this is not reachable from a request body.
   */
  async recordStatusComment(input: StatusComment, actorMatricule: number) {
    return this.databaseService.commentaire.create({
      data: {
        title: input.title,
        type: input.type,
        status: input.status,
        user: { connect: { matricule: actorMatricule } },
        decompte: { connect: { n_decompte: input.decompteId } },
      },
    });
  }

  /** Support inbox, scoped to the caller (own structure for an ADMIN). */
  async findForAdmins(actor: User) {
    return this.databaseService.commentaire.findMany({
      where: { soft_delete: false, ...this.accessPolicy.scopeComments(actor) },
      include: {
        user: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        decompte: {
          select: {
            n_decompte: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
