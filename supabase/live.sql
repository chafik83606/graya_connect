-- Graya Connect — Sessions live (YouTube intégré)
-- Exécutez dans SQL Editor après schema.sql

create table if not exists public.live_sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null default 'Graya en direct',
  youtube_video_id text,
  youtube_url text,
  is_active boolean not null default true,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists live_sessions_active_idx
  on public.live_sessions (is_active, started_at desc);

alter table public.live_sessions enable row level security;

grant select on public.live_sessions to anon, authenticated;
grant insert, update, delete on public.live_sessions to authenticated;

drop policy if exists "Live visible par tous" on public.live_sessions;
create policy "Live visible par tous" on public.live_sessions
  for select using (true);

drop policy if exists "Artiste peut lancer un live" on public.live_sessions;
create policy "Artiste peut lancer un live" on public.live_sessions
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut modifier un live" on public.live_sessions;
create policy "Artiste peut modifier un live" on public.live_sessions
  for update to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut supprimer un live" on public.live_sessions;
create policy "Artiste peut supprimer un live" on public.live_sessions
  for delete to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));
