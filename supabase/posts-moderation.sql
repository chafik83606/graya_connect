-- Graya Connect — Suppression & signalement des posts
-- Exécutez dans SQL Editor

grant delete on public.posts to authenticated;

drop policy if exists "Utilisateur peut supprimer son post" on public.posts;
create policy "Utilisateur peut supprimer son post" on public.posts
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Artiste peut supprimer un post" on public.posts;
create policy "Artiste peut supprimer un post" on public.posts
  for delete to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

create table if not exists public.post_reports (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null default 'Contenu inapproprié',
  created_at timestamptz default now(),
  unique (post_id, reporter_id)
);

alter table public.post_reports enable row level security;
grant insert on public.post_reports to authenticated;

drop policy if exists "Utilisateur peut signaler un post" on public.post_reports;
create policy "Utilisateur peut signaler un post" on public.post_reports
  for insert to authenticated
  with check (auth.uid() = reporter_id);
