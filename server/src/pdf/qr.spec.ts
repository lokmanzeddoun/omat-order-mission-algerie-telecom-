import jsQR from 'jsqr';
import { qrMatrix, scanUrl } from './qr';

/** Rasterises the matrix (with quiet zone) so a real decoder can read it back. */
function decode(text: string): string | null {
  const { size, cells } = qrMatrix(text);
  const scale = 4;
  const quiet = 4;
  const px = (size + quiet * 2) * scale;
  const rgba = new Uint8ClampedArray(px * px * 4).fill(255);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!cells[y * size + x]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i =
            (((y + quiet) * scale + dy) * px + (x + quiet) * scale + dx) * 4;
          rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
        }
      }
    }
  }
  return jsQR(rgba, px, px)?.data ?? null;
}

describe('scanUrl', () => {
  const saved = process.env.APP_PUBLIC_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.APP_PUBLIC_URL;
    else process.env.APP_PUBLIC_URL = saved;
  });

  it('is null when APP_PUBLIC_URL is not configured', () => {
    delete process.env.APP_PUBLIC_URL;
    expect(scanUrl('ordre', 1)).toBeNull();
  });

  it('builds the role-neutral scan link, tolerating a trailing slash', () => {
    process.env.APP_PUBLIC_URL = 'http://10.0.0.12:3001/omat/';
    expect(scanUrl('decompte', 42)).toBe(
      'http://10.0.0.12:3001/omat/scan/decompte/42',
    );
    expect(scanUrl('ordre', 7)).toBe('http://10.0.0.12:3001/omat/scan/ordre/7');
  });
});

describe('qrMatrix', () => {
  it('produces a square matrix that decodes back to the same link', () => {
    const url = 'http://10.0.0.12:3001/omat/scan/decompte/42';
    const { size, cells } = qrMatrix(url);
    expect(cells).toHaveLength(size * size);
    expect(decode(url)).toBe(url);
  });
});
