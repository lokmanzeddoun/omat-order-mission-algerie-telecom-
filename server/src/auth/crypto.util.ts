import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

export const randomToken = (bytes = 32) =>
  randomBytes(bytes).toString('base64url');

export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export const hmac = (key: string, value: string) =>
  createHmac('sha256', key).update(value).digest('hex');

/** Constant-time comparison of two hex digests. */
export function sameDigest(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

/** AES-256-GCM with a key derived from `secret`. Output: iv.tag.ciphertext (base64url). */
export function encrypt(secret: string, plaintext: string): string {
  const key = createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), data]
    .map((b) => b.toString('base64url'))
    .join('.');
}

export function decrypt(secret: string, payload: string): string {
  const [iv, tag, data] = payload
    .split('.')
    .map((p) => Buffer.from(p, 'base64url'));
  const key = createHash('sha256').update(secret).digest();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}
