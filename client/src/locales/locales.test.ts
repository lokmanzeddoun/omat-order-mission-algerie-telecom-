import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGS } from 'i18n';

type Tree = { [key: string]: string | Tree };

const files = import.meta.glob<{ default: Tree }>('./*/*.json', { eager: true });
const byLang: Record<string, Record<string, Tree>> = {};
for (const [path, mod] of Object.entries(files)) {
  const [, lng, ns] = path.match(/\.\/([^/]+)\/([^/]+)\.json$/)!;
  (byLang[lng] ??= {})[ns] = mod.default;
}

// Plural variants differ per language (Arabic has six forms, French three), so compare base keys.
const PLURAL = /_(zero|one|two|few|many|other)$/;

const flatten = (tree: Tree, prefix = ''): [string, string][] =>
  Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [[`${prefix}${k}`, v]] : flatten(v, `${prefix}${k}.`)));

const baseKeys = (tree: Tree) => [...new Set(flatten(tree).map(([k]) => k.replace(PLURAL, '')))].sort();

describe('locales', () => {
  it('has a folder for every supported language with the same namespaces', () => {
    const namespaces = Object.keys(byLang.fr).sort();
    for (const lng of SUPPORTED_LANGS) expect(Object.keys(byLang[lng] ?? {}).sort(), lng).toEqual(namespaces);
  });

  it.each(Object.keys(byLang.fr))('"%s" has the same keys in every language', (ns) => {
    const expected = baseKeys(byLang.fr[ns]);
    for (const lng of SUPPORTED_LANGS) expect(baseKeys(byLang[lng][ns]), `${lng}/${ns}`).toEqual(expected);
  });

  it('has no empty translations', () => {
    for (const lng of SUPPORTED_LANGS) {
      for (const [ns, tree] of Object.entries(byLang[lng])) {
        const empty = flatten(tree).filter(([, v]) => v.trim() === '').map(([k]) => `${lng}/${ns}:${k}`);
        expect(empty).toEqual([]);
      }
    }
  });

  it('uses the same interpolation variables in every language', () => {
    const vars = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).filter((v) => v !== 'count');
    for (const ns of Object.keys(byLang.fr)) {
      const fr = new Map(flatten(byLang.fr[ns]).map(([k, v]) => [k.replace(PLURAL, ''), new Set(vars(v))]));
      for (const [k, v] of flatten(byLang.ar[ns])) {
        const expected = fr.get(k.replace(PLURAL, ''));
        expect(new Set(vars(v)), `ar/${ns}:${k}`).toEqual(expected);
      }
    }
  });
});
