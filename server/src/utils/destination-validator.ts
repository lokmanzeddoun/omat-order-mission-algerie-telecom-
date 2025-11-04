import * as fs from 'fs';
import * as path from 'path';

type City = {
  commune_name_ascii?: string;
};

let communeSet: Set<string> | null = null;

function normalizeToken(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function tryLoadJson(filePath: string): City[] | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data as City[];
    }
  } catch {
    // ignore
  }
  return null;
}

function loadCommuneSet(): Set<string> {
  if (communeSet) return communeSet;

  const envPath = process.env.CITIES_JSON_PATH;
  const candidates = [
    // From env override
    envPath && path.resolve(envPath),
    // Server's own data folder (source)
    path.resolve(__dirname, '../data/algeria_cities.json'),
    // Server's own data folder (compiled dist)
    path.resolve(__dirname, '../../src/data/algeria_cities.json'),
    // When running from repo root
    path.resolve(process.cwd(), 'client/src/data/algeria_cities.json'),
    // When running from server folder (dev)
    path.resolve(process.cwd(), '../client/src/data/algeria_cities.json'),
    // When running TS directly (unlikely to have a copy under server/src)
    path.resolve(process.cwd(), 'src/data/algeria_cities.json'),
    // When running from compiled dist or ts-node; jump to repo root then client
    path.resolve(__dirname, '../../../client/src/data/algeria_cities.json'),
  ].filter(Boolean) as string[];

  let cities: City[] | null = null;
  for (const p of candidates) {
    cities = tryLoadJson(p);
    if (cities) {
      console.log(`[destination-validator] Loaded cities from: ${p}`);
      break;
    }
  }

  if (!cities) {
    console.warn(
      '[destination-validator] Could not load algeria_cities.json from any candidate path',
    );
    console.warn('[destination-validator] Tried paths:', candidates);
  }

  const set = new Set<string>();
  if (cities) {
    for (const c of cities) {
      if (c && typeof c.commune_name_ascii === 'string') {
        set.add(normalizeToken(c.commune_name_ascii));
      }
    }
  }
  communeSet = set;
  return communeSet;
}

export function isValidDestination(destination: string): boolean {
  if (!destination || typeof destination !== 'string') return false;
  const set = loadCommuneSet();
  if (!set || set.size === 0) {
    // If we cannot load the communes list, fail validation conservatively
    return false;
  }
  // Split by '-' and ensure each token is a valid commune name (case-insensitive)
  const parts = destination
    .split('-')
    .map((p) => normalizeToken(p))
    .filter((p) => p.length > 0);

  if (parts.length === 0) return false;

  return parts.every((token) => set.has(token));
}
