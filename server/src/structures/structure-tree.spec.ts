import {
  StructureForest,
  descendantsWhere,
  inferParentCode,
  nameParentMatches,
  nameSegments,
  structureLabel,
  subtreeWhere,
} from './structure-tree';

const HR = [
  '13C0000000',
  '13CA010000',
  '13CA011000',
  '13CA020000',
  '13CC000000',
  '13CT000000',
  '13CT100000',
];

describe('inferParentCode', () => {
  it.each([
    ['13CA011000', '13CA010000'],
    ['13CA010000', '13C0000000'], // no 13CA000000: falls back to the root
    ['13CT100000', '13CT000000'],
    ['13CT000000', '13C0000000'],
    ['13CC000000', '13C0000000'],
    ['13C0000000', null],
  ])('%s -> %s', (code, parent) => {
    expect(inferParentCode(code, HR)).toBe(parent);
  });

  it('ignores codes of another length (hand-made abbreviations)', () => {
    expect(inferParentCode('DTX', ['DT', 'D'])).toBeNull();
    expect(inferParentCode('DT', ['DG', 'DRH'])).toBeNull();
  });

  it('ignores codes that are not HR org-unit numbers', () => {
    expect(inferParentCode('NM-20', ['NM-00', 'NM-10'])).toBeNull();
    expect(inferParentCode('ARC100', ['ARC000'])).toBe('ARC000');
  });
});

describe('nameParentMatches', () => {
  const TREE = [
    { code: 'R', name: 'Sous Direction Commerciale' },
    { code: 'A', name: 'SDC / ACTEL TLEMCEN' },
    {
      code: 'E',
      name: 'SDC / Etablissement Régional Support Technique au Commercial',
    },
    { code: 'O', name: 'Direction Opérationnelle Oran' },
  ];
  const parentOf = (name: string, tree = TREE) => nameParentMatches(name, tree);

  it('matches the parent whose name is the prefix', () => {
    expect(parentOf('SDC / ACTEL TLEMCEN / P.P BENSEKRANE')).toEqual(['A']);
  });

  it('matches a root by the acronym of its name', () => {
    expect(parentOf('SDC / ACTEL GHAZAOUET')).toEqual(['R']);
    expect(parentOf('DOO / ACTEL ORAN EST')).toEqual(['O']);
  });

  it('matches a middle segment by acronym (stopwords skipped)', () => {
    expect(parentOf('SDC / ERSTC /  Section Réseau Intranet AT')).toEqual([
      'E',
    ]);
  });

  it('ignores case, accents and extra spaces', () => {
    expect(parentOf('sdc /  actel   tlemcen / P.P X')).toEqual(['A']);
    expect(
      parentOf(
        'SDC / Etablissement Regional Support Technique AU commercial / S',
      ),
    ).toEqual(['E']);
  });

  it('returns every match when ambiguous, none when nothing fits', () => {
    const twins = [...TREE, { code: 'A2', name: 'SDC / Actel Tlemcen' }];
    expect(parentOf('SDC / ACTEL TLEMCEN / P.P X', twins).sort()).toEqual([
      'A',
      'A2',
    ]);
    expect(parentOf('XYZ / Bureau')).toEqual([]);
  });

  it('a single-segment name has no parent', () => {
    expect(nameSegments('Sous Direction Commerciale')).toHaveLength(1);
    expect(parentOf('Sous Direction Commerciale')).toEqual([]);
  });
});

describe('StructureForest', () => {
  const forest = new StructureForest([
    { code: 'HQ', parentCode: null },
    { code: 'MID', parentCode: 'HQ' },
    { code: 'LEAF', parentCode: 'MID' },
    { code: 'SIDE', parentCode: 'HQ' },
    { code: 'X', parentCode: 'Y' },
    { code: 'Y', parentCode: 'X' },
  ]);

  it('reads depth and height from the parents', () => {
    expect(forest.depth('HQ')).toBe(1);
    expect(forest.depth('LEAF')).toBe(3);
    expect(forest.height('HQ')).toBe(2);
    expect(forest.height('MID')).toBe(1);
    expect(forest.height('SIDE')).toBe(0);
  });

  it('knows the subtree, downward only', () => {
    expect(forest.isInSubtree('HQ', 'LEAF')).toBe(true);
    expect(forest.isInSubtree('MID', 'MID')).toBe(true);
    expect(forest.isInSubtree('MID', 'HQ')).toBe(false);
    expect(forest.isInSubtree('MID', 'SIDE')).toBe(false);
  });

  it('does not loop on a cycle', () => {
    expect(forest.depth('X')).toBe(Infinity);
  });
});

describe('where fragments and labels', () => {
  it('covers children and grandchildren', () => {
    expect(descendantsWhere('HQ')).toEqual({
      OR: [{ parentCode: 'HQ' }, { parent: { parentCode: 'HQ' } }],
    });
    expect(subtreeWhere('HQ')).toEqual({
      OR: [
        { code: 'HQ' },
        { parentCode: 'HQ' },
        { parent: { parentCode: 'HQ' } },
      ],
    });
  });

  it('labels a structure by its name', () => {
    expect(structureLabel({ name: 'SDC / ACTEL TLEMCEN' })).toBe(
      'SDC / ACTEL TLEMCEN',
    );
  });
});
