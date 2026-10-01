import { BadRequestException } from '@nestjs/common';

/** date_retour, when given, must be strictly after date_sortie. */
export function assertReturnAfterDeparture(dto: {
  date_sortie: string;
  date_retour?: string;
}): void {
  if (!dto.date_retour || dto.date_retour.trim() === '') return;
  const dRetour = new Date(dto.date_retour);
  const dSortie = new Date(dto.date_sortie);
  if (isNaN(dRetour.getTime()) || isNaN(dSortie.getTime())) {
    throw new BadRequestException('Invalid date/time format');
  }
  // Option B: return must be strictly after depart
  if (!(dRetour.getTime() > dSortie.getTime())) {
    throw new BadRequestException(
      'date_retour must be strictly after date_sortie',
    );
  }
}
