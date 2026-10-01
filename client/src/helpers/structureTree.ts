/**
 * Structures form a tree of at most 3 levels (ADR 0004). A root's code is its
 * abbreviation; a child's code is its full path, so depth and ancestry can be
 * read from the codes alone (same rules as server/src/structures/structure-path.ts).
 */
export const MAX_STRUCTURE_DEPTH = 3;
export const PATH_SEPARATOR = ' / ';

export interface TreeStructure {
  code: string;
  name: string;
  parentCode?: string | null;
}

/** What to show for a structure: a root's full name, a child's path. */
export const structureLabel = (s: TreeStructure): string => (s.parentCode ? s.code : s.name);

/** 1 for a root, +1 per level. */
export const depthOf = (code: string): number => code.split(PATH_SEPARATOR).length;

export const isDescendant = (ancestorCode: string, code: string): boolean => code.startsWith(ancestorCode + PATH_SEPARATOR);

/** Height of the subtree under `code`: 0 for a leaf. */
export const heightOf = (code: string, all: TreeStructure[]): number =>
  Math.max(0, ...all.filter((s) => isDescendant(code, s.code)).map((s) => depthOf(s.code) - depthOf(code)));

/** Parents → children order (codes embed the path, so a plain sort does it). */
export const sortTree = <T extends TreeStructure>(all: T[]): T[] => [...all].sort((a, b) => a.code.localeCompare(b.code));

/** The structures a new child may be created under. */
export const parentCandidates = <T extends TreeStructure>(all: T[]): T[] => sortTree(all.filter((s) => depthOf(s.code) < MAX_STRUCTURE_DEPTH));

/**
 * The structures `node` may be moved under: not itself or one of its
 * descendants (cycle), not its current parent, and deep enough to hold its subtree.
 */
export const moveTargets = <T extends TreeStructure>(node: TreeStructure, all: T[]): T[] => {
  const height = heightOf(node.code, all);
  return sortTree(
    all.filter(
      (s) =>
        s.code !== node.code &&
        !isDescendant(node.code, s.code) &&
        s.code !== (node.parentCode ?? null) &&
        depthOf(s.code) + 1 + height <= MAX_STRUCTURE_DEPTH,
    ),
  );
};

/** Whether `node` is a child whose subtree fits at the root. */
export const canBecomeRoot = (node: TreeStructure, all: TreeStructure[]): boolean => !!node.parentCode && 1 + heightOf(node.code, all) <= MAX_STRUCTURE_DEPTH;
