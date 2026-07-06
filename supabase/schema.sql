-- Graya Connect - Schéma Supabase complet
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Profils utilisateurs
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  is_artist boolean default false,
  followers_count integer default 0,
  following_count integer default 0,
  created_at timestamptz default now()
);

-- Publications (fil d'actualité)
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

-- Morceaux / musique
create table if not exists public.tracks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null default 'Graya',
  cover_url text,
  audio_url text,
  release_date date,
  plays_count integer default 0,
  created_at timestamptz default now()
);

-- Événements communauté
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  location text not null,
  event_date timestamptz not null,
  image_url text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tracks enable row level security;
alter table public.events enable row level security;

-- Politiques profils
drop policy if exists "Profils visibles par tous" on public.profiles;
create policy "Profils visibles par tous"
  on public.profiles for select using (true);

drop policy if exists "Utilisateur peut modifier son profil" on public.profiles;
create policy "Utilisateur peut modifier son profil"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Utilisateur peut créer son profil" on public.profiles;
create policy "Utilisateur peut créer son profil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Politiques posts
drop policy if exists "Posts visibles par tous" on public.posts;
create policy "Posts visibles par tous"
  on public.posts for select using (true);

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

-- Politiques tracks & events (lecture publique)
drop policy if exists "Tracks visibles par tous" on public.tracks;
create policy "Tracks visibles par tous"
  on public.tracks for select using (true);

drop policy if exists "Events visibles par tous" on public.events;
create policy "Events visibles par tous"
  on public.events for select using (true);

-- Storage : images de posts
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
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage : fichiers audio
insert into storage.buckets (id, name, public)
values ('tracks', 'tracks', true)
on conflict (id) do nothing;

drop policy if exists "Audio public" on storage.objects;
create policy "Audio public"
  on storage.objects for select
  using (bucket_id = 'tracks');

-- Trigger : créer un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Données exemple (optionnel — exécutez une seule fois)
insert into public.tracks (title, artist, audio_url, release_date, plays_count)
select 'Dernière sortie', 'Graya', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', '2025-11-15'::date, 125000
where not exists (select 1 from public.tracks where title = 'Dernière sortie');

insert into public.tracks (title, artist, audio_url, release_date, plays_count)
select 'Freestyle #12', 'Graya', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', '2025-09-01'::date, 89000
where not exists (select 1 from public.tracks where title = 'Freestyle #12');
