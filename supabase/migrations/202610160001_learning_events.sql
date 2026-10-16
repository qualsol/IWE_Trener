-- IWE Trener — etap 5: schemat zdarzeń synchronizacji.
-- Uruchamiać dopiero w wybranym projekcie Supabase po weryfikacji.
create table if not exists public.learning_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  device_id uuid not null,
  event_type text not null check (event_type in ('answer','exam','snapshot')),
  occurred_at timestamptz not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id,event_id)
);
create index if not exists learning_events_user_occurred_idx on public.learning_events(user_id,occurred_at);
alter table public.learning_events enable row level security;
revoke all on public.learning_events from anon;
grant select,insert on public.learning_events to authenticated;
create policy "read own learning events" on public.learning_events for select to authenticated using ((select auth.uid())=user_id);
create policy "insert own learning events" on public.learning_events for insert to authenticated with check ((select auth.uid())=user_id);
-- Celowo brak update/delete dla użytkownika: zdarzenia są niemutowalne.
-- Wersjonowanie payload i walidacja jego struktury będą realizowane w kliencie i testach.
