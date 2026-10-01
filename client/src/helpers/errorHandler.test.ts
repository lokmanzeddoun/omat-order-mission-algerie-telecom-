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
    ['Administrators may create only regular users in their own structure.', 'que des employés de sa structure'],
    ['Only super administrators may change roles.', 'super administrateur'],
    ['You cannot update a user in another structure.', 'autre structure'],
  ])('%s', (message, expected) => {
    expect(extractErrorMessage(serverError(403, message))).toContain(expected);
  });

  it('keeps the generic 403 text for unknown refusals', () => {
    expect(extractErrorMessage(serverError(403, 'Forbidden'))).toBe("Vous n'avez pas les permissions nécessaires");
  });
});
