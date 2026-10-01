import { BadRequestException } from '@nestjs/common';

/** An ordre de mission may not last longer than this many days. */
export const MAX_MISSION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rejects a trip whose return is more than MAX_MISSION_DAYS after its departure. */
export function assertMissionDuration(
  sortie: Date | null | undefined,
  retour: Date | null | undefined,
): void {
  if (!sortie || !retour) return;
  if (retour.getTime() - sortie.getTime() > MAX_MISSION_DAYS * DAY_MS) {
    throw new BadRequestException(
      `Un ordre de mission ne peut pas dépasser ${MAX_MISSION_DAYS} jours.`,
    );
  }
}
