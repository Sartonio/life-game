import { describe, it, expect } from 'vitest';
import { migrateSave, createDemoState, toSave } from '../index.ts';

describe('save · migrateSave', () => {
  it('passes a valid v1 payload through unchanged', () => {
    const demo = createDemoState();
    const data = toSave(demo);

    expect(migrateSave(data)).toEqual(data);
  });

  it('returns null for unknown versions', () => {
    const demo = createDemoState();
    const data = { ...toSave(demo), version: 2 };

    expect(migrateSave(data)).toBeNull();
  });

  it('returns null for malformed payloads', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave(undefined)).toBeNull();
    expect(migrateSave('not an object')).toBeNull();
    expect(migrateSave(42)).toBeNull();
    expect(migrateSave({})).toBeNull();
    expect(migrateSave({ version: 1 })).toBeNull();
    expect(
      migrateSave({ version: 1, storySeen: 'yes', unlockedSections: [], trees: [], goals: {} }),
    ).toBeNull();
    expect(
      migrateSave({ version: 1, storySeen: false, unlockedSections: 'nope', trees: [], goals: {} }),
    ).toBeNull();
    expect(
      migrateSave({ version: 1, storySeen: false, unlockedSections: [], trees: {}, goals: {} }),
    ).toBeNull();
    expect(
      migrateSave({ version: 1, storySeen: false, unlockedSections: [], trees: [], goals: null }),
    ).toBeNull();
  });
});
