/*
 * Jest stand-in for @react-pdf/renderer, which is ESM-only and cannot be loaded
 * by Jest's CommonJS runtime. Real rendering is covered by pdf.service.spec.ts,
 * which runs the renderer in a plain Node process.
 */
const primitive = (name: string) => name;

export const Document = primitive('DOCUMENT');
export const Page = primitive('PAGE');
export const View = primitive('VIEW');
export const Text = primitive('TEXT');
export const Svg = primitive('SVG');
export const Path = primitive('PATH');
export const Rect = primitive('RECT');
export const Circle = primitive('CIRCLE');

export const Font = {
  register: () => undefined,
  registerHyphenationCallback: () => undefined,
};

export const renderToBuffer = async () => Buffer.from('%PDF-stub');
