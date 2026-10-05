import { describe, expect, it } from 'vitest';
import { canBecomeRoot, depthOf, heightOf, moveTargets, parentCandidates, sortTree, structureLabel } from './structureTree';

const ALL = [
  { code: '13CA011000', name: 'SDC / ACTEL TLEMCEN / P.P BENSEKRANE', parentCode: '13CA010000' },
  { code: '13C0000000', name: 'Sous Direction Commerciale', parentCode: null },
  { code: '13CA010000', name: 'SDC / ACTEL TLEMCEN', parentCode: '13C0000000' },
  { code: '13CC000000', name: 'SDC / Département Corporate', parentCode: '13C0000000' },
  { code: 'A1', name: 'Other', parentCode: null },
];
const codes = (xs: { code: string }[]) => xs.map((x) => x.code);

describe('structureTree', () => {
  it('labels a structure by its name', () => {
    expect(structureLabel(ALL[1])).toBe('Sous Direction Commerciale');
    expect(structureLabel(ALL[2])).toBe('SDC / ACTEL TLEMCEN');
  });

  it('reads depth and height from the parents', () => {
    expect(depthOf('13C0000000', ALL)).toBe(1);
    expect(depthOf('13CA011000', ALL)).toBe(3);
    expect(heightOf('13C0000000', ALL)).toBe(2);
    expect(heightOf('13CA010000', ALL)).toBe(1);
    expect(heightOf('13CC000000', ALL)).toBe(0);
  });

  it('sorts parents before their children', () => {
    expect(codes(sortTree(ALL))).toEqual(['13C0000000', '13CA010000', '13CA011000', '13CC000000', 'A1']);
  });

  it('offers no parent at the last level', () => {
    expect(codes(parentCandidates(ALL))).toEqual(['13C0000000', '13CA010000', '13CC000000', 'A1']);
  });

  it('offers only valid move targets: no cycle, no too-deep subtree, not the current parent', () => {
    // 13CA010000 has height 1: it fits under a root only.
    expect(codes(moveTargets(ALL[2], ALL))).toEqual(['A1']);
    // A leaf fits under any non-leaf structure but its current parent.
    expect(codes(moveTargets(ALL[0], ALL))).toEqual(['13C0000000', '13CC000000', 'A1']);
    // The root has height 2: it can go nowhere (and never under itself).
    expect(codes(moveTargets(ALL[1], ALL))).toEqual([]);
  });

  it('knows which structures can become roots', () => {
    expect(canBecomeRoot(ALL[1], ALL)).toBe(false); // already a root
    expect(canBecomeRoot(ALL[2], ALL)).toBe(true);
  });
});
