import { RP } from '../react-pdf-runtime';
import { qrMatrix } from '../qr';
import { color } from '../theme';

const QUIET = 4; // modules of white margin required around a QR code

/** Vector QR code: one path of dark modules, so it prints crisp at any size. */
export function QrCode({
  value,
  width = 58,
}: {
  value: string;
  width?: number;
}) {
  const { size, cells } = qrMatrix(value);
  const total = size + QUIET * 2;
  let d = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (cells[y * size + x]) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
    }
  }
  return (
    <RP.Svg viewBox={`0 0 ${total} ${total}`} style={{ width, height: width }}>
      <RP.Path d={d} fill={color.ink} />
    </RP.Svg>
  );
}
