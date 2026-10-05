/**
 * Structures form a tree of at most 3 levels (ADR 0005, 0006). A code is an opaque identifier
 * (the HR "Unité org." number); depth and ancestry come from `parentCode` alone (same rules as
 * server/src/structures/structure-tree.ts).
 */
export const MAX_STRUCTURE_DEPTH = 3;

export interface TreeStructure {
  code: string;
  name: string;
  parentCode?: string | null;
}

/** What to show for a structure. */
export const structureLabel = (s: TreeStructure): string => s.name;

/** `code` and its ancestors, nearest first (stops on a cycle). */
const ancestry = (code: string, all: TreeStructure[]): string[] => {
  const parentOf = new Map(all.map((s) => [s.code, s.parentCode ?? null]));
  const chain: string[] = [];
  for (let c: string | null | undefined = code; c != null && !chain.includes(c); c = parentOf.get(c)) chain.push(c);
  return chain;
};

/** 1 for a root, +1 per level. */
export const depthOf = (code: string, all: TreeStructure[]): number => ancestry(code, all).length;

export const isDescendant = (ancestorCode: string, code: string, all: TreeStructure[]): boolean =>
  code !== ancestorCode && ancestry(code, all).includes(ancestorCode);

/** Height of the subtree under `code`: 0 for a leaf. */
export const heightOf = (code: string, all: TreeStructure[]): number =>
  Math.max(0, ...all.filter((s) => isDescendant(code, s.code, all)).map((s) => depthOf(s.code, all) - depthOf(code, all)));

/** Parents → children order: each structure right after its parent, siblings by code. */
export const sortTree = <T extends TreeStructure>(all: T[]): T[] => {
  const key = (s: T) =>
    ancestry(s.code, all)
      .reverse()
      .map((c) => c.padEnd(64))
      .join('\u0000');
  return [...all].sort((a, b) => key(a).localeCompare(key(b)));
};

/** The structures a new child may be created under. */
export const parentCandidates = <T extends TreeStructure>(all: T[]): T[] => sortTree(all.filter((s) => depthOf(s.code, all) < MAX_STRUCTURE_DEPTH));

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
        !isDescendant(node.code, s.code, all) &&
        s.code !== (node.parentCode ?? null) &&
        depthOf(s.code, all) + 1 + height <= MAX_STRUCTURE_DEPTH,
    ),
  );
};

/** Whether `node` is a child whose subtree fits at the root. */
export const canBecomeRoot = (node: TreeStructure, all: TreeStructure[]): boolean => !!node.parentCode && 1 + heightOf(node.code, all) <= MAX_STRUCTURE_DEPTH;
