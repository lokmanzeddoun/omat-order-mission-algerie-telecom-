/**
 * Structure paths (ADR 0004). Structures form a tree of at most 3 levels:
 *
 *   SDC                                      root:  code = abbreviation
 *   SDC / ACTEL TLEMCEN                      child: code = full path
 *   SDC / ERSTC / Section Réseau Intranet AT grandchild
 *
 * Everything here is pure so the rules can be tested without a database.
 */

export const PATH_SEPARATOR = ' / ';
export const MAX_STRUCTURE_DEPTH = 3;

export type StructurePathErrorCode =
  | 'EMPTY'
  | 'EMPTY_SEGMENT'
  | 'NOT_A_CHILD'
  | 'TOO_DEEP'
  | 'UNKNOWN_ROOT';

export class StructurePathError extends Error {
  constructor(
    readonly code: StructurePathErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StructurePathError';
  }
}

export interface ParsedStructurePath {
  /** Normalized segments; the first one is the root's code. */
  segments: string[];
  /** Normalized full path = the structure's code. */
  code: string;
  /** Code of the parent (the path without its last segment). */
  parentCode: string;
  /** The structure's own segment. */
  name: string;
  /** 2 or 3 (a root has no path). */
  depth: number;
  rootCode: string;
}

/** Splits a path on "/" and trims every segment (empty ones are kept to be reported). */
export function splitPath(path: string): string[] {
  return path.split('/').map((s) => s.trim());
}

/** The code of a child named `name` under `parentCode`. */
export function childCode(parentCode: string, name: string): string {
  return `${parentCode}${PATH_SEPARATOR}${name}`;
}

/** Whether `code` is a strict descendant of `ancestorCode` (codes embed the path). */
export function isDescendantCode(ancestorCode: string, code: string): boolean {
  return code.startsWith(ancestorCode + PATH_SEPARATOR);
}

/** `code` or one of its descendants. */
export function isInSubtreeCode(ancestorCode: string, code: string): boolean {
  return code === ancestorCode || isDescendantCode(ancestorCode, code);
}

/** Depth of a structure from its code alone: a root is 1, each " / " adds one. */
export function depthFromCode(code: string): number {
  return code.split(PATH_SEPARATOR).length;
}

/** Whether a root code or own-segment name is acceptable (no "/" that would corrupt paths). */
export function isValidSegment(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && !v.includes('/');
}

/**
 * Parses the path of a child structure.
 *
 * - at least 2 segments (a root is declared with its code + name, not a path);
 * - at most `MAX_STRUCTURE_DEPTH` segments;
 * - no empty segment;
 * - the first segment must be the code of an existing root (matched ignoring
 *   case; the root's own spelling is what ends up in the code).
 *
 * It does not check that the intermediate parents exist: the caller knows
 * what is in the database and in the file being imported.
 */
export function parseStructurePath(
  path: string,
  rootCodes: Iterable<string>,
): ParsedStructurePath {
  if (typeof path !== 'string' || path.trim() === '') {
    throw new StructurePathError('EMPTY', 'Chemin vide');
  }
  const segments = splitPath(path);
  if (segments.some((s) => s === '')) {
    throw new StructurePathError('EMPTY_SEGMENT', 'Chemin avec un segment vide');
  }
  if (segments.length < 2) {
    throw new StructurePathError(
      'NOT_A_CHILD',
      'Un chemin doit avoir au moins 2 niveaux (racine / structure); une racine se déclare avec son code et son nom',
    );
  }
  if (segments.length > MAX_STRUCTURE_DEPTH) {
    throw new StructurePathError(
      'TOO_DEEP',
      `Profondeur maximale de ${MAX_STRUCTURE_DEPTH} niveaux dépassée`,
    );
  }
  const wanted = segments[0].toLowerCase();
  let root: string | undefined;
  for (const code of rootCodes) {
    if (code.toLowerCase() === wanted) {
      root = code;
      break;
    }
  }
  if (!root) {
    throw new StructurePathError(
      'UNKNOWN_ROOT',
      `Racine inconnue « ${segments[0]} »`,
    );
  }
  const normalized = [root, ...segments.slice(1)];
  return {
    segments: normalized,
    code: normalized.join(PATH_SEPARATOR),
    parentCode: normalized.slice(0, -1).join(PATH_SEPARATOR),
    name: normalized[normalized.length - 1],
    depth: normalized.length,
    rootCode: root,
  };
}

/** What the UI and the PDFs show for a structure: a root's full name, a child's path. */
export function structureLabel(s: {
  code: string;
  name: string;
  parentCode?: string | null;
}): string {
  return s.parentCode ? s.code : s.name;
}

/**
 * The code a structure takes when the subtree rooted at `oldBase` is re-keyed
 * to `newBase` (a move or a rename): the shared prefix is swapped, the rest of
 * the path is kept.
 */
export function rekeyCode(
  code: string,
  oldBase: string,
  newBase: string,
): string {
  if (!isInSubtreeCode(oldBase, code)) {
    throw new Error(`${code} is not in the subtree of ${oldBase}`);
  }
  return newBase + code.slice(oldBase.length);
}
