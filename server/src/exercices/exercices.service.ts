import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ExercicesService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    try {
      await this.ensureCurrentForNow();
    } catch (e) {
      // Do not crash app on bootstrap; logs only
      // eslint-disable-next-line no-console
      console.error('[Exercices] ensureCurrentForNow failed on bootstrap:', e);
    }
  }

  async list() {
    await this.ensureCurrentForNow();
    return this.db['exercice'].findMany({ orderBy: { year: 'desc' } });
  }

  async getCurrent() {
    await this.ensureCurrentForNow();
    const ex = await this.db['exercice'].findFirst({
      where: { isCurrent: true },
    });
    return ex ?? null;
  }

  async ensureCurrentForNow() {
    const nowYear = new Date().getFullYear();
    // Backfill exercice rows and links for any existing data
    await this.backfillExercices();
    const current = await this.db['exercice'].findFirst({
      where: { isCurrent: true },
    });
    if (current?.year === nowYear) return current;

    // Make sure the nowYear exercice exists
    let now = await this.db['exercice'].findUnique({
      where: { year: nowYear },
    });
    if (!now) {
      now = await this.db['exercice'].create({
        data: { year: nowYear, isCurrent: false },
      });
    }
    // Switch current to nowYear
    await this.db.$transaction([
      this.db['exercice'].updateMany({
        data: { isCurrent: false },
        where: { isCurrent: true },
      }),
      this.db['exercice'].update({
        where: { id: now.id },
        data: { isCurrent: true },
      }),
    ]);
    return now;
  }

  private async backfillExercices() {
    // Discover years from missions and decomptes
    const missionYearsRaw = await this.db.mission.findMany({
      where: { date_sortie: { not: null } },
      select: { date_sortie: true },
    });
    const years = new Set<number>();
    for (const m of missionYearsRaw) {
      const y = new Date(m.date_sortie as unknown as Date).getFullYear();
      if (!isNaN(y)) years.add(y);
    }

    if (years.size === 0) return; // nothing to backfill

    // Ensure exercice rows exist
    for (const y of years) {
      const existing = await this.db['exercice'].findUnique({
        where: { year: y },
      });
      if (!existing) {
        await this.db['exercice'].create({
          data: { year: y, isCurrent: false },
        });
      }
    }

    // Link missions and decomptes with missing exerciceId
    for (const y of years) {
      const ex = await this.db['exercice'].findUnique({ where: { year: y } });
      if (!ex) continue;
      const gte = new Date(y, 0, 1);
      const lt = new Date(y + 1, 0, 1);
      // Attach missions in year range missing exerciceId
      await this.db.mission.updateMany({
        where: { exerciceId: null, date_sortie: { gte, lt } },
        data: { exerciceId: ex.id },
      });
      // Attach decomptes via mission date in year range missing exerciceId
      await this.db.decompte.updateMany({
        where: { exerciceId: null, mission: { date_sortie: { gte, lt } } },
        data: { exerciceId: ex.id },
      });
    }
  }
}
