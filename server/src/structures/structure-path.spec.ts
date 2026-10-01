import {
  StructurePathError,
  childCode,
  depthFromCode,
  isDescendantCode,
  isInSubtreeCode,
  isValidSegment,
  parseStructurePath,
} from './structure-path';

const ROOTS = ['SDC', 'DOT'];

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof StructurePathError ? e.code : 'OTHER';
  }
  return undefined;
}

describe('parseStructurePath', () => {
  it('parses a child of a root', () => {
    expect(parseStructurePath('SDC / ACTEL TLEMCEN', ROOTS)).toEqual({
      segments: ['SDC', 'ACTEL TLEMCEN'],
      code: 'SDC / ACTEL TLEMCEN',
      parentCode: 'SDC',
      name: 'ACTEL TLEMCEN',
      depth: 2,
      rootCode: 'SDC',
    });
  });

  it('parses a grandchild and derives its parent path', () => {
    const p = parseStructurePath(
      'SDC / ERSTC / Section Réseau Intranet AT',
      ROOTS,
    );
    expect(p.parentCode).toBe('SDC / ERSTC');
    expect(p.name).toBe('Section Réseau Intranet AT');
    expect(p.depth).toBe(3);
  });

  it('normalizes spacing around the separator', () => {
    expect(parseStructurePath('  SDC/ERSTC  ', ROOTS).code).toBe('SDC / ERSTC');
  });

  it("matches the root's code ignoring case and keeps the root's spelling", () => {
    expect(parseStructurePath('sdc / ERSTC', ROOTS).code).toBe('SDC / ERSTC');
  });

  it('rejects an unknown root', () => {
    expect(codeOf(() => parseStructurePath('XYZ / A', ROOTS))).toBe(
      'UNKNOWN_ROOT',
    );
  });

  it('matches the root by its code, not by its full name', () => {
    expect(
      codeOf(() =>
        parseStructurePath('Sous Direction Commerciale / A', ROOTS),
      ),
    ).toBe('UNKNOWN_ROOT');
  });

  it('rejects a depth above 3', () => {
    expect(codeOf(() => parseStructurePath('SDC / A / B / C', ROOTS))).toBe(
      'TOO_DEEP',
    );
  });

  it('rejects a single segment (a root is declared by code and name)', () => {
    expect(codeOf(() => parseStructurePath('SDC', ROOTS))).toBe('NOT_A_CHILD');
  });

  it('rejects empty paths and empty segments', () => {
    expect(codeOf(() => parseStructurePath('   ', ROOTS))).toBe('EMPTY');
    expect(codeOf(() => parseStructurePath('SDC / / A', ROOTS))).toBe(
      'EMPTY_SEGMENT',
    );
    expect(codeOf(() => parseStructurePath('SDC / A /', ROOTS))).toBe(
      'EMPTY_SEGMENT',
    );
  });
});

describe('code helpers', () => {
  it('builds child codes', () => {
    expect(childCode('SDC', 'ERSTC')).toBe('SDC / ERSTC');
  });

  it('knows descendants from codes alone', () => {
    expect(isDescendantCode('SDC', 'SDC / A')).toBe(true);
    expect(isDescendantCode('SDC', 'SDC / A / B')).toBe(true);
    expect(isDescendantCode('SDC', 'SDC')).toBe(false);
    expect(isDescendantCode('SDC', 'SDCX / A')).toBe(false);
    expect(isInSubtreeCode('SDC', 'SDC')).toBe(true);
  });

  it('computes the depth of a code', () => {
    expect(depthFromCode('SDC')).toBe(1);
    expect(depthFromCode('SDC / A')).toBe(2);
    expect(depthFromCode('SDC / A / B')).toBe(3);
  });

  it('rejects segments that would corrupt paths', () => {
    expect(isValidSegment('ERSTC')).toBe(true);
    expect(isValidSegment('A / B')).toBe(false);
    expect(isValidSegment('  ')).toBe(false);
  });
});
