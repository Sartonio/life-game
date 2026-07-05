// Internal implementation. Deep imports from other modules are blocked by lint.
import type { SaveData } from './schema.ts';

export type AuthResult = { ok: true } | { ok: false; error: string };

export interface SaveGateway {
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;
}

export interface AuthGateway {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  currentUserId(): string | null;
}

export interface Gateways {
  auth: AuthGateway;
  store: SaveGateway;
}

export interface NullGatewaySeed {
  save?: SaveData;
  /** email → password */
  users?: Record<string, string>;
}

/**
 * Nullable (A-Frame pattern): in-memory gateways with the same behavior as
 * the Supabase ones. All logic tests run against these — no network.
 */
export function createNullGateways(seed?: NullGatewaySeed): Gateways {
  const users = new Map<string, string>(Object.entries(seed?.users ?? {}));
  let stored: SaveData | null = seed?.save ?? null;
  let userId: string | null = null;

  const auth: AuthGateway = {
    signUp(email, password) {
      if (users.has(email)) {
        return Promise.resolve({ ok: false, error: 'An account with this email already exists' });
      }
      users.set(email, password);
      userId = email;
      return Promise.resolve({ ok: true });
    },
    signIn(email, password) {
      if (!users.has(email) || users.get(email) !== password) {
        return Promise.resolve({ ok: false, error: 'Invalid email or password' });
      }
      userId = email;
      return Promise.resolve({ ok: true });
    },
    currentUserId: () => userId,
  };

  const store: SaveGateway = {
    load: () => Promise.resolve(stored),
    save(data) {
      stored = data;
      return Promise.resolve();
    },
  };

  return { auth, store };
}
