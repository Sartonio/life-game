import { describe, it, expect } from 'vitest';
import { tileState } from '../../world/index.ts';
import { createDemoState, createNullGateways, loadOrCreate, toSave } from '../index.ts';

describe('save · null auth gateway', () => {
  it('signUp then signIn succeeds and currentUserId reflects the signed-in user', async () => {
    const { auth } = createNullGateways();

    expect(auth.currentUserId()).toBeNull();

    const up = await auth.signUp('ryan@example.com', 'hunter2');
    expect(up.ok).toBe(true);

    const inn = await auth.signIn('ryan@example.com', 'hunter2');
    expect(inn.ok).toBe(true);
    expect(auth.currentUserId()).not.toBeNull();
  });

  it('signIn with the wrong password fails with an error and leaves no user signed in', async () => {
    const { auth } = createNullGateways({ users: { 'ryan@example.com': 'hunter2' } });

    const result = await auth.signIn('ryan@example.com', 'wrong');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    expect(auth.currentUserId()).toBeNull();
  });

  it('signIn for an unknown email fails with an error', async () => {
    const { auth } = createNullGateways();

    const result = await auth.signIn('nobody@example.com', 'pw');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it('signUp for an already-registered email fails with an error', async () => {
    const { auth } = createNullGateways({ users: { 'ryan@example.com': 'hunter2' } });

    const result = await auth.signUp('ryan@example.com', 'other');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });
});

describe('save · null save gateway', () => {
  it('load returns null when empty, and returns what save stored', async () => {
    const { store } = createNullGateways();

    expect(await store.load()).toBeNull();

    const data = toSave(createDemoState());
    await store.save(data);
    expect(await store.load()).toEqual(data);
  });

  it('load returns a seeded save', async () => {
    const data = toSave(createDemoState());
    const { store } = createNullGateways({ save: data });

    expect(await store.load()).toEqual(data);
  });
});

describe('save · loadOrCreate', () => {
  it('hydrates an existing save', async () => {
    const demo = createDemoState();
    const saved = { ...toSave(demo), storySeen: true };
    const { store } = createNullGateways({ save: saved });

    const state = await loadOrCreate(store);

    expect(state.storySeen).toBe(true);
    expect(state.trees).toEqual(demo.trees);
    const tree = demo.trees[0];
    if (!tree) throw new Error('demo tree missing');
    expect(tileState(state.world, tree.tile)).toBe('vibrant');
  });

  it('returns the demo state when the gateway has no save', async () => {
    const { store } = createNullGateways();

    const state = await loadOrCreate(store);

    expect(state).toEqual(createDemoState());
  });

  it('returns the demo state when the stored payload is invalid', async () => {
    const invalid = { version: 99, junk: true } as unknown as ReturnType<typeof toSave>;
    const { store } = createNullGateways({ save: invalid });

    const state = await loadOrCreate(store);

    expect(state).toEqual(createDemoState());
  });
});
