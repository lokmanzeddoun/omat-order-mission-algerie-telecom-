import * as fs from 'fs';
import * as path from 'path';
import { registerDecorator, ValidationOptions } from 'class-validator';

/** Separator between destinations in the stored string (spaced, so hyphenated commune names stay intact). */
export const DESTINATION_SEPARATOR = ' - ';
export const MAX_DESTINATIONS = 10;

type City = {
  commune_name_ascii: string;
  wilaya_name_ascii: string;
};

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

let allowed: Set<string> | null = null;

/**
 * Canonical destination values: a wilaya ("Oran") or a commune qualified by its
 * wilaya ("Timekten (Adrar)"). Kept in sync with client/src/lib/destinations.ts.
 */
function loadAllowed(): Set<string> {
  if (allowed) return allowed;
  const file = path.resolve(
    process.env.CITIES_JSON_PATH ??
      path.join(__dirname, '../data/algeria_cities.json'),
  );
  const cities = JSON.parse(fs.readFileSync(file, 'utf-8')) as City[];
  const set = new Set<string>();
  for (const c of cities) {
    const wilaya = clean(c.wilaya_name_ascii);
    set.add(wilaya);
    set.add(`${clean(c.commune_name_ascii)} (${wilaya})`);
  }
  allowed = set;
  return set;
}

export function isValidDestination(destination: unknown): boolean {
  if (typeof destination !== 'string' || !destination) return false;
  const parts = destination.split(DESTINATION_SEPARATOR);
  if (parts.length > MAX_DESTINATIONS) return false;
  if (new Set(parts).size !== parts.length) return false;
  const set = loadAllowed();
  return parts.every((p) => set.has(p));
}

export function IsValidDestination(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isValidDestination',
      target: object.constructor,
      propertyName,
      options: {
        message: `La destination doit être une liste de wilayas ou de communes d'Algérie (au plus ${MAX_DESTINATIONS}, sans doublon) séparées par "${DESTINATION_SEPARATOR}"`,
        ...options,
      },
      validator: { validate: (value: unknown) => isValidDestination(value) },
    });
}
