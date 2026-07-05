# S12 · Auth + persistence (save, + auth screen in ui)

**Modules:** `save` (primary) and `ui` (the sign-in form only) — ≤2 modules,
per the PRD's slice rule. `save` may import `@supabase/supabase-js` (already
in allowedExternals) plus config/world/entities via `index.ts`. The Supabase
client is wrapped as a **Nullable** (A-Frame pattern): all tests are
state-based against the null gateway — no mocking frameworks, no network.

## Behavior

### Versioned save schema (`save`)

- `SaveDataV1 = { version: 1; storySeen: boolean; unlockedSections: number[];`
  `trees: { id; tile; type; tasksDone; goalId }[]; goals: Record<string, Goal> }`
  — focus is NOT persisted (PRD).
- `SaveData = SaveDataV1` (the current version alias).
- `migrateSave(raw: unknown): SaveData | null` — version dispatch with a
  migration stub: `version: 1` passes through (after shape sanity checks);
  anything else returns null (treated as no save). This is where v2
  migrations will land.

### Serialization (`save`)

- `toSave(input: { world: World; trees: readonly Tree[]; goals: Record<string, Goal>; storySeen: boolean }): SaveData`
  — unlockedSections derived from the world via `isSectionUnlocked`.
- `fromSave(data: SaveData): { world: World; trees: Tree[]; goals: Record<string, Goal>; storySeen: boolean }`
  — rebuilds the world: `createWorld()`, unlock the saved sections, then
  re-apply `revealAround` at every tree's tile (trees are what made land
  vibrant; land never regresses).
- Round-trip on the demo state and on richer states must reproduce identical
  world tile states, trees, goals, and storySeen. (Example tests on fixed
  seeds — NOT property tests, per the testing tier.)

### Demo start state (`save`)

- `createDemoState(): { world; trees; goals; storySeen: false }` — one
  preplanted type-A sapling with the Sleep plan goal (0 tasks done) on a
  deterministic section-1 tile whose full 3×3 lies inside section 1 (pick the
  first such tile in layout order), with its 3×3 already vibrant.

### Gateway (Nullable) (`save`)

- `SaveGateway = { load(): Promise<SaveData | null>; save(data: SaveData): Promise<void> }`
- `AuthGateway = { signIn(email, password): Promise<{ ok: true } | { ok: false; error: string }>; signUp(email, password): Promise<same>; currentUserId(): string | null }`
- `createSupabaseGateways(url: string, anonKey: string): { auth: AuthGateway; store: SaveGateway }`
  — real implementation over `createClient`; persistence table `saves`
  keyed by user id with a jsonb `data` column (document the expected DDL in a
  comment + `src/modules/save/supabase.sql` stub); `migrateSave` applied on
  load. Untested beyond construction (thin shell).
- `createNullGateways(seed?: { save?: SaveData; users?: Record<string, string> }): { auth; store }`
  — in-memory implementation with identical behavior; all logic tests run
  against this.
- `loadOrCreate(store: SaveGateway): Promise<ReturnType<typeof fromSave>>` —
  a valid save hydrates via `fromSave`; no/invalid save returns
  `createDemoState()` (first login ⇒ demo state).
- `createAutosaver(store: SaveGateway, debounceMs, timers?: { setTimeout; clearTimeout }): { schedule(input: Parameters<typeof toSave>[0]): void; flush(): Promise<void> }`
  — debounced persist for task-completion/plant/unlock events; injectable
  timers for tests.

### Sign-in screen (`ui`)

- `createAuthScreen(deps: { onSignIn(email, password): void; onSignUp(email, password): void }): { el; showError(msg): void; hide(): void }`
  — full-screen form: email + password inputs, Sign in + Sign up buttons,
  error line. Pure intent-out DOM (no save import — ui's allowedImports are
  unchanged; S13 wires it to the AuthGateway). Testids: `auth-screen`,
  `auth-email`, `auth-password`, `auth-signin`, `auth-signup`, `auth-error`.

### Credentials — ESCALATION, not fabrication

Read `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in S13 wiring (not in
this slice). NEVER invent or commit env values. This slice must leave the
repo fully green and runnable with the null gateways alone. Add `.env.local`
to .gitignore if not covered and create `.env.example` with the two empty
keys.

## Done when

Tests written FIRST — example-based only, against null gateways / fixed
seeds:

- save round-trip: demo state → toSave → fromSave reproduces identical tile
  states, trees, goals, storySeen; same for a state with an unlocked section
  2, a complete tree, and a mid-progress tree;
- migrateSave: passes a valid v1 through, returns null for unknown versions
  and malformed payloads;
- loadOrCreate: hydrates an existing save; returns the demo state when the
  gateway has none or the payload is invalid;
- demo state: exactly one type-A tree, Sleep plan goal with 0 done, its 3×3
  vibrant inside section 1, storySeen false;
- null auth: signUp then signIn succeeds; wrong password fails with an
  error; currentUserId reflects the signed-in user;
- autosaver: schedule twice within the debounce window persists once
  (injected timers); flush persists pending data immediately;
- auth screen (happy-dom): renders inputs and both buttons; submits entered
  credentials to the right callback; showError displays the message; hide
  hides it.

`pnpm verify` green.

## Out of scope

Wiring into main/core-app (S13), the real Supabase project/keys (escalate to
Ryan), RLS/policies beyond the SQL stub comment, debounce timing polish.
Everything not listed. No changes outside `src/modules/save/`,
`src/modules/ui/`, `.env.example`, `.gitignore` (plus `.task/`).
