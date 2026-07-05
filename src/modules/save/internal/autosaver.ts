// Internal implementation. Deep imports from other modules are blocked by lint.
import type { SaveGateway } from './gateways.ts';
import { migrateSave } from './schema.ts';
import type { GameState, SaveInput } from './serialize.ts';
import { createDemoState, fromSave, toSave } from './serialize.ts';

/**
 * A valid save hydrates via fromSave; no save (or an invalid payload)
 * returns the demo state — first login starts the demo.
 */
export async function loadOrCreate(store: SaveGateway): Promise<GameState> {
  const raw = await store.load();
  const data = migrateSave(raw);
  return data ? fromSave(data) : createDemoState();
}

export interface AutosaverTimers {
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
}

export interface Autosaver {
  /** Debounced persist — call on task-completion / plant / unlock events. */
  schedule(input: SaveInput): void;
  /** Persist any pending data immediately. */
  flush(): Promise<void>;
}

const defaultTimers: AutosaverTimers = {
  setTimeout: (callback, ms) => setTimeout(callback, ms) as unknown as number,
  clearTimeout: (id) => {
    clearTimeout(id);
  },
};

export function createAutosaver(
  store: SaveGateway,
  debounceMs: number,
  timers: AutosaverTimers = defaultTimers,
): Autosaver {
  let pending: SaveInput | null = null;
  let timerId: number | null = null;

  const persist = async (): Promise<void> => {
    if (pending === null) return;
    const input = pending;
    pending = null;
    await store.save(toSave(input));
  };

  return {
    schedule(input) {
      pending = input;
      if (timerId !== null) timers.clearTimeout(timerId);
      timerId = timers.setTimeout(() => {
        timerId = null;
        void persist();
      }, debounceMs);
    },
    async flush() {
      if (timerId !== null) {
        timers.clearTimeout(timerId);
        timerId = null;
      }
      await persist();
    },
  };
}
