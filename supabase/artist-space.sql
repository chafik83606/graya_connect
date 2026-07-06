-- Graya Connect — Espace artiste (concerts, morceaux)
-- Exécutez ce script dans SQL Editor

-- Lien billetterie optionnel sur les événements
alter table public.events add column if not exists ticket_url text;

-- Permissions artiste sur événements et morceaux
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.tracks to authenticated;

drop policy if exists "Artiste peut créer événement" on public.events;
create policy "Artiste peut créer événement" on public.events
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut modifier événement" on public.events;
create policy "Artiste peut modifier événement" on public.events
  for update to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut supprimer événement" on public.events;
create policy "Artiste peut supprimer événement" on public.events
  for delete to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut ajouter morceau" on public.tracks;
create policy "Artiste peut ajouter morceau" on public.tracks
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut modifier morceau" on public.tracks;
create policy "Artiste peut modifier morceau" on public.tracks
  for update to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut supprimer morceau" on public.tracks;
create policy "Artiste peut supprimer morceau" on public.tracks
  for delete to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

-- Upload audio (bucket tracks)
drop policy if exists "Artiste upload audio" on storage.objects;
create policy "Artiste upload audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tracks'
    and exists (select 1 from public.profiles where id = auth.uid() and is_artist = true)
  );
