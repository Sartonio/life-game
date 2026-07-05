-- Expected schema for the Life Game save store (run in the Supabase SQL
-- editor when the project is provisioned — escalate to Ryan for the actual
-- project; no URLs/keys live in this repo).
--
-- One row per user; the whole SaveData document lives in `data` (jsonb).

create table if not exists saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Each user reads/writes only their own row.
alter table saves enable row level security;

create policy "own save: select" on saves for select using (auth.uid () = user_id);

create policy "own save: insert" on saves for insert
with
  check (auth.uid () = user_id);

create policy "own save: update" on saves for update using (auth.uid () = user_id);
