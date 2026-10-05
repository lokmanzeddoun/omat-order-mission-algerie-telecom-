import type { Prisma } from '@prisma/client';

/**
 * Structure tree (ADR 0006). A structure's `code` is an opaque identifier (the
 * HR "Unité org." number, e.g. 13CA010000); the tree is given by `parentCode`
 * alone, at most 3 levels deep:
 *
 *   13C0000000  Sous Direction Commerciale
 *   13CA010000  SDC / ACTEL TLEMCEN
 *   13CA011000  SDC / ACTEL TLEMCEN / P.P BENSEKRANE
 *
 * Everything here is pure so the rules can be tested without a database.
 */

export const MAX_STRUCTURE_DEPTH = 3;

/** What the UI and the PDFs show for a structure. */
export function structureLabel(s: { name: string }): string {
  return s.name;
}

/**
 * The strict descendants of `code` as a Structure `where`. The depth is at
 * most 3, so a child or a grandchild covers them all without recursion.
 */
export function descendantsWhere(code: string): Prisma.StructureWhereInput {
  return {
    OR: [{ parentCode: code }, { parent: { parentCode: code } }],
  };
}

/** `code` and its descendants as a Structure `where`. */
export function subtreeWhere(code: string): Prisma.StructureWhereInput {
  return { OR: [{ code }, ...descendantsWhere(code).OR!] };
}

/** An HR code without its trailing zeros: 13CA010000 → 13CA01. */
const significant = (code: string) => code.replace(/0+$/, '');

/** Only HR org-unit numbers encode their parent (13CA010000), not hand-made codes (NM-10, DT). */
const isHrCode = (code: string) => /^[0-9A-Z]{6,}$/i.test(code);

/**
 * The parent an HR code implies among `candidates`: the code of the same
 * length whose significant digits are the longest strict prefix of its own
 * (13CA011000 → 13CA010000 → 13C0000000). Null when none matches.
 */
export function inferParentCode(
  code: string,
  candidates: Iterable<string>,
): string | null {
  if (!isHrCode(code)) return null;
  const own = significant(code);
  let best: string | null = null;
  for (const candidate of candidates) {
    if (
      candidate === code ||
      candidate.length !== code.length ||
      !isHrCode(candidate)
    )
      continue;
    const prefix = significant(candidate);
    if (
      prefix &&
      prefix.length < own.length &&
      own.startsWith(prefix) &&
      (!best || prefix.length > significant(best).length)
    ) {
      best = candidate;
    }
  }
  return best;
}

/** A name's " / "-separated segments, trimmed, inner spaces collapsed. */
export function nameSegments(name: string): string[] {
  return name.split('/').map((s) => s.trim().replace(/\s+/g, ' '));
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const STOPWORDS = new Set(
  'de du des d la le les l au aux et en a pour sur'.split(' '),
);

/** Sous Direction Commerciale → sdc; stopwords skipped, accents folded. */
function acronym(segment: string): string {
  return fold(segment)
    .split(/[\s'’-]+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => w[0])
    .join('');
}

/** Equal once folded, or one is the acronym of the other (SDC ↔ Sous Direction Commerciale). */
function sameSegment(a: string, b: string): boolean {
  const fa = fold(a);
  const fb = fold(b);
  return fa === fb || fa === acronym(b) || acronym(a) === fb;
}

/**
 * The structures a " / "-separated name points to as its parent (ADR 0006):
 * those whose name has the same segments as all but the last one, each segment
 * equal or an acronym of the other.
 *
 *   SDC / ERSTC / Section X → SDC / Etablissement Régional Support Technique au Commercial
 *   SDC / ACTEL TLEMCEN     → Sous Direction Commerciale
 *
 * The caller decides what zero or several matches mean.
 */
export function nameParentMatches(
  name: string,
  candidates: Iterable<{ code: string; name: string }>,
): string[] {
  const expected = nameSegments(name).slice(0, -1);
  if (expected.length === 0) return [];
  const matches: string[] = [];
  for (const c of candidates) {
    const segments = nameSegments(c.name);
    if (
      segments.length === expected.length &&
      segments.every((s, i) => sameSegment(s, expected[i]))
    ) {
      matches.push(c.code);
    }
  }
  return matches;
}

export interface TreeNode {
  code: string;
  parentCode: string | null;
}

/** Depth, height and ancestry over a set of structures held in memory. */
export class StructureForest {
  private readonly parentOf = new Map<string, string | null>();

  constructor(nodes: Iterable<TreeNode>) {
    for (const n of nodes) this.parentOf.set(n.code, n.parentCode ?? null);
  }

  has(code: string): boolean {
    return this.parentOf.has(code);
  }

  /** `code` and its ancestors, nearest first; stops on a cycle. */
  ancestry(code: string): string[] {
    const chain: string[] = [];
    let current: string | null | undefined = code;
    while (current != null && !chain.includes(current)) {
      chain.push(current);
      current = this.parentOf.get(current);
    }
    return chain;
  }

  /** 1 for a root, +1 per level; Infinity on a cycle. */
  depth(code: string): number {
    const chain = this.ancestry(code);
    const top = this.parentOf.get(chain[chain.length - 1]);
    return top != null ? Infinity : chain.length;
  }

  /** Whether `code` is `ancestor` or one of its descendants. */
  isInSubtree(ancestor: string, code: string): boolean {
    return this.ancestry(code).includes(ancestor);
  }

  /** Height of the subtree under `code`: 0 for a leaf. */
  height(code: string): number {
    const own = this.depth(code);
    let height = 0;
    for (const other of this.parentOf.keys()) {
      if (other !== code && this.isInSubtree(code, other)) {
        height = Math.max(height, this.depth(other) - own);
      }
    }
    return height;
  }
}
