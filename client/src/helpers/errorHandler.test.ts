import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import 'i18n';
import { extractErrorMessage } from './errorHandler';

const serverError = (status: number, message: string) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { statusCode: status, message },
  });

describe('extractErrorMessage — access refusals explain the rule', () => {
  it.each([
    ['You cannot validate or decide on your own record.', 'propre dossier'],
    ['Administrators may create only regular users in their own structure or its sub-structures.', 'que des employés de sa structure'],
    ['Only super administrators may change roles.', 'super administrateur'],
    ['You cannot update a user in another structure.', 'autre structure'],
  ])('%s', (message, expected) => {
    expect(extractErrorMessage(serverError(403, message))).toContain(expected);
  });

  it('keeps the generic 403 text for unknown refusals', () => {
    expect(extractErrorMessage(serverError(403, 'Forbidden'))).toBe("Vous n'avez pas les permissions nécessaires");
  });
});

// Messages exactly as server/src/grade-assignments/grade-assignments.service.ts sends them.
describe('extractErrorMessage — Intérim/Remplaçant refusals keep their reason', () => {
  it('explains the duration cap with the latest allowed end date', () => {
    const message =
      'Une période continue ne peut dépasser 4 mois : elle doit se terminer au plus tard le 2027-02-11 (début de la période continue : 2026-10-12).';
    expect(extractErrorMessage(serverError(400, message))).toBe(
      'Une période continue ne peut pas dépasser 4 mois : elle doit se terminer au plus tard le 11/02/2027 (début de la période continue : 12/10/2026).',
    );
  });

  it.each([
    [409, 'Cette période chevauche la période n° 7 du même agent.', 'chevauche la période n° 7'],
    [400, "La catégorie visée doit être strictement supérieure à celle de l'agent.", 'strictement supérieure'],
    [400, 'La date de fin doit être postérieure ou égale à la date de début.', 'postérieure ou égale'],
    [400, 'Cette période est déjà terminée.', 'déjà terminée'],
    [400, 'Cette période est déjà échue.', 'déjà échue'],
  ])('%i %s', (status, message, expected) => {
    expect(extractErrorMessage(serverError(status, message))).toContain(expected);
  });
});

// Message exactly as server/src/decompte/decompte.service.ts sends it.
describe('extractErrorMessage — décompte counts', () => {
  it('shows the meals and nights the server expects', () => {
    const message = 'Le nombre de repas et hebergement non valid : le trajet compte 3 repas et 1 nuitée(s).';
    expect(extractErrorMessage(serverError(400, message))).toBe(
      "Le nombre de repas et d'hébergements n'est pas valide : le trajet compte 3 repas et 1 nuitée(s).",
    );
  });
});
