/**
 * Email check that accepts internationalised domains as users type them
 * (`@algérietelecom.dz`). Zod's `.email()` and `<input type="email">` only
 * handle ASCII: the first rejects the address, the second silently converts the
 * domain to punycode, which then matches no account.
 */
const EMAIL = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/u;

export const isEmail = (value: string): boolean => EMAIL.test(value);
