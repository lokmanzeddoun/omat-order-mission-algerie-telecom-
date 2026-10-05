import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccessPolicy, Actor } from './access-policy';

/** The fixture tree: HQ ── MID ── LEAF, HQ ── SIDE; OTHER and HQX stand alone. */
const DESCENDANTS: Record<string, string[]> = {
  HQ: ['MID', 'LEAF', 'SIDE'],
  MID: ['LEAF'],
  LEAF: [],
};
const admin = (serviceId: string | null, hasResponsible = true): Actor => ({
  matricule: 10,
  role: Role.ADMIN,
  serviceId,
  serviceHasResponsible: hasResponsible,
  descendantCodes: serviceId ? (DESCENDANTS[serviceId] ?? []) : [],
});
const user: Actor = { matricule: 20, role: Role.USER, serviceId: 'HQ' };
const superAdmin: Actor = {
  matricule: 30,
  role: Role.SUPER_ADMIN,
  serviceId: null,
};

describe('AccessPolicy: structure subtree (ADR 0005, 0006)', () => {
  const policy = new AccessPolicy();

  describe('canActInStructure', () => {
    // [actor structure, target structure, allowed]
    it.each([
      ['HQ', 'HQ', true],
      ['HQ', 'MID', true],
      ['HQ', 'LEAF', true],
      ['MID', 'MID', true],
      ['MID', 'LEAF', true],
      ['MID', 'HQ', false], // never upwards
      ['MID', 'SIDE', false], // never sideways
      ['LEAF', 'MID', false],
      ['LEAF', 'LEAF', true],
      ['HQ', 'HQX', false], // a prefix is not a descendant
      ['HQ', 'OTHER', false],
    ])('admin of %s on %s -> %s', (own, target, allowed) => {
      expect(policy.canActInStructure(admin(own), target)).toBe(allowed);
    });

    it('an admin without a structure acts nowhere', () => {
      expect(policy.canActInStructure(admin(null), 'HQ')).toBe(false);
      expect(policy.canActInStructure(admin(null), null)).toBe(false);
    });

    it('a structure without responsible is out of reach of its own admin, not of ancestors', () => {
      expect(policy.canActInStructure(admin('MID', false), 'MID')).toBe(false);
      expect(policy.canActInStructure(admin('MID', false), 'LEAF')).toBe(true);
      expect(policy.canActInStructure(admin('HQ', true), 'MID')).toBe(true);
    });

    it('a super admin acts everywhere, a user nowhere', () => {
      expect(policy.canActInStructure(superAdmin, 'ANY')).toBe(true);
      expect(policy.canActInStructure(user, 'HQ')).toBe(false);
    });
  });

  describe('canAccessUser', () => {
    it('follows the subtree and always allows oneself', () => {
      const a = admin('MID');
      expect(policy.canAccessUser(a, { matricule: 1, serviceId: 'LEAF' })).toBe(
        true,
      );
      expect(policy.canAccessUser(a, { matricule: 1, serviceId: 'HQ' })).toBe(
        false,
      );
      expect(policy.canAccessUser(a, { matricule: 10, serviceId: 'HQ' })).toBe(
        true,
      );
      expect(policy.canAccessUser(a, { matricule: 1, serviceId: null })).toBe(
        false,
      );
    });

    it('a user only reaches themselves', () => {
      expect(
        policy.canAccessUser(user, { matricule: 20, serviceId: 'HQ' }),
      ).toBe(true);
      expect(
        policy.canAccessUser(user, { matricule: 21, serviceId: 'HQ' }),
      ).toBe(false);
    });
  });

  describe('where fragments', () => {
    it('scope an admin to the strict descendants plus their own structure when it has a responsible', () => {
      expect(policy.scopeStructures(admin('MID'))).toEqual({
        OR: [
          { parentCode: 'MID' },
          { parent: { parentCode: 'MID' } },
          { code: 'MID', responsibleUserId: { not: null } },
        ],
      });
      expect(policy.scopeMissions(admin('HQ'))).toEqual({
        user: { structure: policy.scopeStructures(admin('HQ')) },
      });
      expect(policy.scopeDecomptes(admin('HQ'))).toEqual({
        mission: { user: { structure: policy.scopeStructures(admin('HQ')) } },
      });
      expect(policy.scopeComments(admin('HQ'))).toEqual({
        user: { structure: policy.scopeStructures(admin('HQ')) },
      });
    });

    it('an admin without a structure matches nothing', () => {
      const where = JSON.stringify(policy.scopeStructures(admin(null)));
      expect(where).toContain('__NO_ASSIGNED_STRUCTURE__');
    });

    it('stay unrestricted for a super admin and own-only for a user', () => {
      expect(policy.scopeUsers(superAdmin)).toEqual({});
      expect(policy.scopeMissions(user)).toEqual({ userId: 20 });
      expect(policy.scopeUsers(user)).toEqual({ matricule: 20 });
      expect(policy.scopeStructures(user)).toEqual({ code: 'HQ' });
    });
  });

  it('self-approval is still forbidden for an ancestor admin', () => {
    expect(() => policy.assertNotSelfApproval(admin('HQ'), 10)).toThrow(
      ForbiddenException,
    );
    expect(() => policy.assertNotSelfApproval(admin('HQ'), 11)).not.toThrow();
  });
});
