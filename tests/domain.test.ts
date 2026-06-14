import { describe, test, expect } from 'vitest';
import { buildRef, parseRef, isValidProjectKey } from '@/lib/domain';

describe('isValidProjectKey', () => {
  test('accepts uppercase keys 2–10 chars', () => {
    expect(isValidProjectKey('DISK')).toBe(true);
    expect(isValidProjectKey('AB')).toBe(true);
    expect(isValidProjectKey('PROJ123')).toBe(true);
  });

  test('rejects malformed keys', () => {
    expect(isValidProjectKey('a')).toBe(false); // too short + lowercase
    expect(isValidProjectKey('disk')).toBe(false); // lowercase
    expect(isValidProjectKey('1ABC')).toBe(false); // leading digit
    expect(isValidProjectKey('A-B')).toBe(false); // hyphen
    expect(isValidProjectKey('TOOLONGKEYY')).toBe(false); // 11 chars
  });
});

describe('buildRef / parseRef', () => {
  test('buildRef joins key and seq', () => {
    expect(buildRef('DISK', 14)).toBe('DISK-14');
  });

  test('parseRef round-trips a valid ref', () => {
    expect(parseRef('DISK-14')).toEqual({ key: 'DISK', seq: 14 });
  });

  test('parseRef returns null for malformed refs', () => {
    expect(parseRef('DISK')).toBeNull();
    expect(parseRef('DISK-')).toBeNull();
    expect(parseRef('-14')).toBeNull();
    expect(parseRef('disk-14')).toBeNull();
    expect(parseRef('DISK-0')).toBeNull();
    expect(parseRef('DISK-1.5')).toBeNull();
  });
});
