import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

export interface AuditEvent {
  actorMatricule?: number;
  action: string;
  entity: string;
  entityId: string | number;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}

  record(event: AuditEvent) {
    return this.db.auditLog.create({
      data: {
        ...event,
        entityId: String(event.entityId),
        before: event.before as Prisma.InputJsonValue | undefined,
        after: event.after as Prisma.InputJsonValue | undefined,
      },
    });
  }

  list(actor: User) {
    return this.db.auditLog.findMany({
      where:
        actor.role === 'SUPER_ADMIN' ? {} : { actorMatricule: actor.matricule },
      orderBy: { at: 'desc' },
      take: 500,
    });
  }
}
