import { validateNavConfig, NAV_ITEMS, normalizeRole } from '@/config/navigationConfig';

describe('navigationConfig', () => {
  test('validateNavConfig returns true and no duplicate keys', () => {
    expect(validateNavConfig()).toBe(true);
  });

  test('all items have lowercase role set compatibility', () => {
    for (const item of NAV_ITEMS) {
      for (const role of item.roles) {
        expect(role).toBe(role.toLowerCase());
      }
    }
  });

  test('normalizeRole handles case-insensitive roles', () => {
    expect(normalizeRole('OWNER')).toBe('owner');
    expect(normalizeRole('SuperAdmin')).toBe('superadmin');
    expect(normalizeRole('unknown')).toBeUndefined();
  });
});
