import { describe, expect, it } from 'vitest';
import { canBecomeRoot, depthOf, heightOf, moveTargets, parentCandidates, sortTree, structureLabel } from './structureTree';

const ALL = [
  { code: 'HQ / MID / LEAF', name: 'LEAF', parentCode: 'HQ / MID' },
  { code: 'HQ', name: 'Headquarters', parentCode: null },
  { code: 'HQ / MID', name: 'MID', parentCode: 'HQ' },
  { code: 'HQ / SIDE', name: 'SIDE', parentCode: 'HQ' },
  { code: 'OTHER', name: 'Other', parentCode: null },
];
const codes = (xs: { code: string }[]) => xs.map((x) => x.code);

describe('structureTree', () => {
  it('labels a root by its name and a child by its path', () => {
    expect(structureLabel(ALL[1])).toBe('Headquarters');
    expect(structureLabel(ALL[2])).toBe('HQ / MID');
  });

  it('reads depth and height from codes', () => {
    expect(depthOf('HQ')).toBe(1);
    expect(depthOf('HQ / MID / LEAF')).toBe(3);
    expect(heightOf('HQ', ALL)).toBe(2);
    expect(heightOf('HQ / MID', ALL)).toBe(1);
    expect(heightOf('HQ / SIDE', ALL)).toBe(0);
  });

  it('sorts parents before their children', () => {
    expect(codes(sortTree(ALL))).toEqual(['HQ', 'HQ / MID', 'HQ / MID / LEAF', 'HQ / SIDE', 'OTHER']);
  });

  it('offers no parent at the last level', () => {
    expect(codes(parentCandidates(ALL))).toEqual(['HQ', 'HQ / MID', 'HQ / SIDE', 'OTHER']);
  });

  it('offers only valid move targets: no cycle, no too-deep subtree, not the current parent', () => {
    // HQ / MID has height 1: it fits under a root only.
    expect(codes(moveTargets(ALL[2], ALL))).toEqual(['OTHER']);
    // A leaf fits under any non-leaf structure but its current parent.
    expect(codes(moveTargets(ALL[0], ALL))).toEqual(['HQ', 'HQ / SIDE', 'OTHER']);
    // HQ has height 2: it can go nowhere (and never under itself).
    expect(codes(moveTargets(ALL[1], ALL))).toEqual([]);
  });

  it('knows which structures can become roots', () => {
    expect(canBecomeRoot(ALL[1], ALL)).toBe(false); // already a root
    expect(canBecomeRoot(ALL[2], ALL)).toBe(true);
  });
});
