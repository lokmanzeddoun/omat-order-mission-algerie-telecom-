import type * as ReactPdf from '@react-pdf/renderer';

let cached: typeof ReactPdf | undefined;

// TypeScript downlevels `import()` to `require()` when targeting CommonJS,
// which defeats the point (require() can't load an ESM-only package). Going
// through `new Function` hides the import() from that transform, so it stays
// a genuine dynamic import at runtime.
const dynamicImport: (specifier: string) => Promise<unknown> = new Function(
  'specifier',
  'return import(specifier)',
) as never;

/**
 * @react-pdf/renderer is ESM-only (yoga-layout has top-level await), so this
 * CommonJS server can't require() it. Dynamic import() works from CJS, so we
 * load it once here and have every component read it through `RP` below,
 * which resolves once the module has been loaded.
 */
export async function loadReactPdf(): Promise<typeof ReactPdf> {
  cached ??= (await dynamicImport('@react-pdf/renderer')) as typeof ReactPdf;
  return cached;
}

function get<K extends keyof typeof ReactPdf>(key: K): (typeof ReactPdf)[K] {
  if (!cached) {
    throw new Error('react-pdf not loaded yet; call loadReactPdf() first');
  }
  return cached[key];
}

export const RP = {
  get Document() {
    return get('Document');
  },
  get Page() {
    return get('Page');
  },
  get Text() {
    return get('Text');
  },
  get View() {
    return get('View');
  },
  get Svg() {
    return get('Svg');
  },
  get Path() {
    return get('Path');
  },
  get Rect() {
    return get('Rect');
  },
  get Circle() {
    return get('Circle');
  },
  get Font() {
    return get('Font');
  },
};
