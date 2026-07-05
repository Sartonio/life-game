// Internal implementation. Deep imports from other modules are blocked by lint.
//
// Thin, untested shell over @supabase/supabase-js. All persistence logic
// lives behind the SaveGateway/AuthGateway interfaces and is tested against
// the null gateways; this file only adapts the Supabase client to them.
//
// Expected DDL (see ../supabase.sql for the runnable stub):
//
//   create table saves (
//     user_id uuid primary key references auth.users (id) on delete cascade,
//     data jsonb not null,
//     updated_at timestamptz not null default now()
//   );
//
// Row-level security (each user reads/writes only their own row) is part of
// the Supabase project setup, not this slice.
import { createClient } from '@supabase/supabase-js';
import type { Gateways } from './gateways.ts';
import { migrateSave } from './schema.ts';

export function createSupabaseGateways(url: string, anonKey: string): Gateways {
  const client = createClient(url, anonKey);

  const userId = (): Promise<string | null> =>
    client.auth.getSession().then(({ data }) => data.session?.user.id ?? null);

  let cachedUserId: string | null = null;
  void userId().then((id) => (cachedUserId = id));

  return {
    auth: {
      async signIn(email, password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        cachedUserId = data.user.id;
        return { ok: true };
      },
      async signUp(email, password) {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) return { ok: false, error: error.message };
        cachedUserId = data.user?.id ?? cachedUserId;
        return { ok: true };
      },
      currentUserId: () => cachedUserId,
    },
    store: {
      async load() {
        const id = await userId();
        if (id === null) return null;
        const { data, error } = await client
          .from('saves')
          .select('data')
          .eq('user_id', id)
          .maybeSingle();
        if (error || data === null) return null;
        return migrateSave(data.data);
      },
      async save(data) {
        const id = await userId();
        if (id === null) return;
        await client.from('saves').upsert({ user_id: id, data });
      },
    },
  };
}
