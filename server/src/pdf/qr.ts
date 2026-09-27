import * as QRCode from 'qrcode';

export type ScanKind = 'ordre' | 'decompte';

/**
 * Link printed in the QR code. It points at the client's role-neutral
 * /scan route, which forwards to the right detail page after login.
 *
 * APP_PUBLIC_URL must be an address phones can reach (e.g. the LAN IP plus the
 * /omat basename). Without it no QR is printed rather than a dead localhost link.
 */
export function scanUrl(kind: ScanKind, id: number | string): string | null {
  const base = process.env.APP_PUBLIC_URL?.trim().replace(/\/+$/, '');
  if (!base || id === null || id === undefined || id === '') return null;
  return `${base}/scan/${kind}/${id}`;
}

export interface QrMatrix {
  size: number;
  /** Row-major; true = dark module. */
  cells: boolean[];
}

export function qrMatrix(text: string): QrMatrix {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  return {
    size: modules.size,
    cells: Array.from(modules.data, (v) => v === 1),
  };
}
