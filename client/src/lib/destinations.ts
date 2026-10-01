/** Raw row of src/data/algeria_cities.json. */
export interface CityRow {
  commune_name_ascii: string;
  commune_name: string;
  wilaya_name_ascii: string;
  wilaya_name: string;
}

export interface DestinationOption {
  /** Canonical stored value: "Oran" (wilaya) or "Timekten (Adrar)" (commune). Matches the server. */
  value: string;
  kind: 'wilaya' | 'commune';
  /** Latin name, without the wilaya qualifier. */
  name: string;
  nameAr: string;
  /** Parent wilaya (communes only). */
  wilaya?: string;
  wilayaAr?: string;
  /** Normalized haystack for matching. */
  search: string;
  /** Normalized Latin and Arabic names, for prefix ranking. */
  names: string[];
}

/** Separator between destinations in the stored string (spaced, so hyphenated names stay intact). */
export const DESTINATION_SEPARATOR = ' - ';
export const MAX_DESTINATIONS = 10;

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

/** Lowercase, strip accents and Arabic diacritics, unify hyphens/apostrophes and similar letters. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ًͯ-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/[-'’]/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function buildDestinations(rows: CityRow[]): DestinationOption[] {
  const wilayas = new Map<string, DestinationOption>();
  const communes: DestinationOption[] = [];
  for (const r of rows) {
    const wilaya = clean(r.wilaya_name_ascii);
    if (!wilayas.has(wilaya)) {
      const names = [normalize(wilaya), normalize(r.wilaya_name)];
      wilayas.set(wilaya, {
        value: wilaya,
        kind: 'wilaya',
        name: wilaya,
        nameAr: r.wilaya_name,
        search: names.join(' '),
        names,
      });
    }
    const name = clean(r.commune_name_ascii);
    const names = [normalize(name), normalize(r.commune_name)];
    communes.push({
      value: `${name} (${wilaya})`,
      kind: 'commune',
      name,
      nameAr: r.commune_name,
      wilaya,
      wilayaAr: r.wilaya_name,
      search: [...names, normalize(wilaya), normalize(r.wilaya_name)].join(' '),
      names,
    });
  }
  return [...wilayas.values(), ...communes];
}

/** Suggestions for what the user typed: names starting with it first, wilayas before communes. */
export function searchDestinations(options: DestinationOption[], query: string, limit = 50): DestinationOption[] {
  const q = normalize(query);
  if (!q) return [];
  const scored: [number, DestinationOption][] = [];
  for (const o of options) {
    let rank: number;
    if (o.names.some((n) => n.startsWith(q))) rank = 0;
    else if (o.names.some((n) => n.split(' ').some((w) => w.startsWith(q)))) rank = 1;
    else if (o.search.includes(q)) rank = 2;
    else continue;
    scored.push([rank * 2 + (o.kind === 'wilaya' ? 0 : 1), o]);
  }
  return scored
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)
    .map(([, o]) => o);
}

export const joinDestinations = (values: string[]) => values.join(DESTINATION_SEPARATOR);

/**
 * Turns a stored value back into options. Handles legacy free text ("Alger-Oran") best-effort;
 * returns null when some part cannot be matched unambiguously (the user must re-pick).
 */
export function parseDestinations(options: DestinationOption[], stored?: string | null): DestinationOption[] | null {
  if (!stored?.trim()) return [];
  const byValue = new Map(options.map((o) => [o.value, o]));
  const parts = stored.split(DESTINATION_SEPARATOR);
  if (parts.every((p) => byValue.has(p))) return parts.map((p) => byValue.get(p)!);

  // Legacy: communes/wilayas separated by "-", some of which contain hyphens themselves.
  const byName = new Map<string, DestinationOption[]>();
  for (const o of options) {
    const key = normalize(o.name);
    byName.set(key, [...(byName.get(key) ?? []), o]);
  }
  const tokens = stored
    .split('-')
    .map((t) => t.trim())
    .filter(Boolean);
  const out: DestinationOption[] = [];
  let i = 0;
  while (i < tokens.length) {
    let matched: DestinationOption | null = null;
    let len = 0;
    for (let n = tokens.length - i; n >= 1 && !matched; n--) {
      const candidates = byName.get(normalize(tokens.slice(i, i + n).join(' ')));
      if (!candidates) continue;
      const pick = candidates.find((c) => c.kind === 'wilaya') ?? (candidates.length === 1 ? candidates[0] : null);
      if (!pick) return null; // ambiguous commune name
      matched = pick;
      len = n;
    }
    if (!matched) return null;
    out.push(matched);
    i += len;
  }
  return out.length ? out : null;
}
