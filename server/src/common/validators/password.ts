import { randomInt } from 'crypto';
import { ValidationOptions, registerDecorator } from 'class-validator';
import { COMMON_PASSWORDS } from './common-passwords';

/** Length bounds (NIST SP 800-63B / ASVS V2.1): long passphrases, no composition rules. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
export const BCRYPT_ROUNDS = 12;

/** Why a password is refused, or null when it is acceptable on its own. */
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string') return 'Le mot de passe est requis';
  const length = [...password].length;
  if (length < PASSWORD_MIN) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères`;
  }
  if (length > PASSWORD_MAX) {
    return `Le mot de passe doit contenir au plus ${PASSWORD_MAX} caractères`;
  }
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || /^(.)\1+$/.test(password)) {
    return 'Ce mot de passe est trop courant ; choisissez-en un autre';
  }
  return null;
}

/**
 * Refuses a password that contains who the user is (name, email, matricule)
 * or that repeats the current one. Checked in the service, which knows the user.
 */
export function personalPasswordProblem(
  password: string,
  user: { nom?: string; prenom?: string; email?: string; matricule?: number },
): string | null {
  const lower = password.toLowerCase();
  const parts = [
    user.nom,
    user.prenom,
    user.email?.split('@')[0],
    user.matricule ? String(user.matricule) : undefined,
  ]
    .filter((p): p is string => !!p && p.length >= 4)
    .map((p) => p.toLowerCase());
  return parts.some((p) => lower.includes(p))
    ? 'Le mot de passe ne doit pas contenir votre nom, votre e-mail ou votre matricule'
    : null;
}

/** class-validator decorator for passwordProblem(). */
export function IsAcceptablePassword(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isAcceptablePassword',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => passwordProblem(value) === null,
        defaultMessage: (args) =>
          passwordProblem(args?.value) ?? 'Mot de passe invalide',
      },
    });
}

// No 0/O, 1/l/I: the temporary password is read out or copied by hand.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A random single-use password, e.g. `k7Qm-4xZp-Rt9w-hN3c` (~94 bits). */
export function temporaryPassword(): string {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
  ).join('-');
}
