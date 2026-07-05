import { describe, it, expect } from 'vitest';
import { createAutosaver, createDemoState, createNullGateways, toSave } from '../index.ts';

/** Deterministic injectable timers: callbacks fire only via fire(). */
function fakeTimers() {
  let nextId = 1;
  const pending = new Map<number, () => void>();
  return {
    setTimeout: (cb: () => void): number => {
      const id = nextId++;
      pending.set(id, cb);
      return id;
    },
    clearTimeout: (id: number): void => {
      pending.delete(id);
    },
    fire(): void {
      const callbacks = [...pending.values()];
      pending.clear();
      for (const cb of callbacks) cb();
    },
    count(): number {
      return pending.size;
    },
  };
}

describe('save · autosaver', () => {
  it('scheduling twice within the debounce window persists once, with the latest data', async () => {
    const { store } = createNullGateways();
    const timers = fakeTimers();
    const autosaver = createAutosaver(store, 500, timers);

    const first = createDemoState();
    const second = { ...createDemoState(), storySeen: true };
    autosaver.schedule(first);
    autosaver.schedule(second);

    expect(await store.load()).toBeNull(); // nothing persisted yet
    expect(timers.count()).toBe(1); // first timer was cancelled

    timers.fire();
    await autosaver.flush(); // let the in-flight save settle

    expect(await store.load()).toEqual(toSave(second));
  });

  it('flush persists pending data immediately without waiting for the timer', async () => {
    const { store } = createNullGateways();
    const timers = fakeTimers();
    const autosaver = createAutosaver(store, 500, timers);

    const state = createDemoState();
    autosaver.schedule(state);
    await autosaver.flush();

    expect(await store.load()).toEqual(toSave(state));
    expect(timers.count()).toBe(0); // pending timer cancelled by flush
  });

  it('flush with nothing pending is a no-op', async () => {
    const { store } = createNullGateways();
    const autosaver = createAutosaver(store, 500, fakeTimers());

    await autosaver.flush();

    expect(await store.load()).toBeNull();
  });
});
