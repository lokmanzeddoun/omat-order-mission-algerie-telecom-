import * as path from 'path';
import { RP } from './react-pdf-runtime';

// Fonts ship next to this file (copied to dist by nest-cli "assets").
const FONT_DIR = path.join(__dirname, 'fonts');

let fontsRegistered = false;
export function registerFonts() {
  if (fontsRegistered) return;
  RP.Font.register({
    family: 'Inter',
    fonts: [
      { src: path.join(FONT_DIR, 'Inter-Regular.ttf'), fontWeight: 400 },
      { src: path.join(FONT_DIR, 'Inter-Medium.ttf'), fontWeight: 500 },
      { src: path.join(FONT_DIR, 'Inter-SemiBold.ttf'), fontWeight: 600 },
      { src: path.join(FONT_DIR, 'Inter-Bold.ttf'), fontWeight: 700 },
    ],
  });
  // Administrative forms: never hyphenate names or places.
  RP.Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export const color = {
  ink: '#18212B',
  text: '#2B3540',
  muted: '#6A7581',
  faint: '#98A2AD',
  hairline: '#C5CDD5',
  rule: '#8D98A4',
  navy: '#233E83', // Algérie Télécom blue (from the logo)
  green: '#367F3E', // Algérie Télécom green (from the logo)
  greenSoft: '#8DBF7A',
  tint: '#F2F7F2',
  panel: '#F7F9FB',
  white: '#FFFFFF',
};

export const size = {
  micro: 6.5,
  tiny: 7.5,
  small: 8.5,
  body: 9.5,
  value: 10.5,
  lead: 12,
  title: 17,
};

export const space = {
  pageX: 38,
  pageTop: 26,
  pageBottom: 58,
};

// Constant header block shared by both documents.
export const DRT_LABEL = 'TLEMCEN';

export const COMPANY = {
  legal: 'EPE / SPA au capital social de',
  capital: '61 275 180 000,00 DA',
  rc: 'R.C. n° 02 B 18083',
  address:
    'Siège Social : Route Nationale n° 5, Cinq-Maisons, Mohammadia 16030 Alger',
  phone: 'Téléphone : 021 82.38.38',
};
