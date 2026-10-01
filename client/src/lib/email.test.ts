import { describe, expect, it } from 'vitest';
import { isEmail } from './email';

describe('isEmail', () => {
  it('accepts the accented company domain as typed', () => {
    expect(isEmail('karim.mansouri@algérietelecom.dz')).toBe(true);
  });

  it('accepts ASCII and punycode domains', () => {
    expect(isEmail('a.b@example.com')).toBe(true);
    expect(isEmail('a.b@xn--algrietelecom-dhb.dz')).toBe(true);
  });

  it.each(['', 'nope', 'a@b', '@algérietelecom.dz', 'a b@c.dz', 'a@@c.dz', 'a@c.d'])('rejects %j', (value) => {
    expect(isEmail(value)).toBe(false);
  });
});
