import { decrypt, encrypt, hmac, randomToken, sameDigest } from './crypto.util';

describe('crypto.util', () => {
  it('round-trips AES-GCM and never stores the plaintext', () => {
    const sealed = encrypt('k'.repeat(32), 'JBSWY3DPEHPK3PXP');
    expect(sealed).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decrypt('k'.repeat(32), sealed)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('refuses a tampered ciphertext or a wrong key', () => {
    const sealed = encrypt('k'.repeat(32), 'secret');
    const [iv, tag, data] = sealed.split('.');
    const flipped = Buffer.from(data, 'base64url');
    flipped[0] ^= 1;
    expect(() =>
      decrypt(
        'k'.repeat(32),
        [iv, tag, flipped.toString('base64url')].join('.'),
      ),
    ).toThrow();
    expect(() => decrypt('x'.repeat(32), sealed)).toThrow();
  });

  it('compares digests in constant time and by value', () => {
    const a = hmac('key', 'value');
    expect(sameDigest(a, hmac('key', 'value'))).toBe(true);
    expect(sameDigest(a, hmac('key', 'other'))).toBe(false);
    expect(sameDigest(a, 'abcd')).toBe(false);
  });

  it('generates distinct URL-safe tokens', () => {
    const t = randomToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(t);
  });
});
