-- Graya Connect — Correction des permissions RLS
-- Exécutez ce script dans SQL Editor si la publication échoue

-- Accès aux tables pour les utilisateurs connectés
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.posts to anon, authenticated;
grant insert, update on public.posts to authenticated;
grant select on public.tracks to anon, authenticated;
grant select on public.events to anon, authenticated;

-- === PROFILES ===
alter table public.profiles enable row level security;

drop policy if exists "Profils visibles par tous" on public.profiles;
create policy "Profils visibles par tous"
  on public.profiles for select
  using (true);

drop policy if exists "Utilisateur peut créer son profil" on public.profiles;
create policy "Utilisateur peut créer son profil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Utilisateur peut modifier son profil" on public.profiles;
create policy "Utilisateur peut modifier son profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- === POSTS ===
alter table public.posts enable row level security;

drop policy if exists "Posts visibles par tous" on public.posts;
create policy "Posts visibles par tous"
  on public.posts for select
  using (true);

drop policy if exists "Utilisateur authentifié peut poster" on public.posts;
create policy "Utilisateur authentifié peut poster"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Utilisateur peut liker" on public.posts;
create policy "Utilisateur peut liker"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

-- === STORAGE (photos) ===
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "Images publiques" on storage.objects;
create policy "Images publiques"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "Upload images authentifié" on storage.objects;
create policy "Upload images authentifié"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images');

drop policy if exists "Supprimer ses images" on storage.objects;
create policy "Supprimer ses images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
