-- Graya Connect — Actualités (presse, clips, sorties)
-- Exécutez dans SQL Editor

create table if not exists public.news_articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  url text,
  source text,
  image_url text,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.news_articles enable row level security;

grant select on public.news_articles to anon, authenticated;
grant insert, update, delete on public.news_articles to authenticated;

drop policy if exists "Actualités visibles par tous" on public.news_articles;
create policy "Actualités visibles par tous" on public.news_articles
  for select using (true);

drop policy if exists "Artiste peut publier actualité" on public.news_articles;
create policy "Artiste peut publier actualité" on public.news_articles
  for insert to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut modifier actualité" on public.news_articles;
create policy "Artiste peut modifier actualité" on public.news_articles
  for update to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

drop policy if exists "Artiste peut supprimer actualité" on public.news_articles;
create policy "Artiste peut supprimer actualité" on public.news_articles
  for delete to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_artist = true
  ));

-- Exemples (optionnel — supprimez si vous préférez tout ajouter depuis l'app)
insert into public.news_articles (title, summary, url, source, published_at)
select
  'Nouveau single CAUCHEMAR',
  'Le dernier single de Graya est disponible sur toutes les plateformes.',
  'https://www.youtube.com/@GrayaOfficiel',
  'YouTube',
  now()
where not exists (select 1 from public.news_articles where title = 'Nouveau single CAUCHEMAR');

insert into public.news_articles (title, summary, url, source, published_at)
select
  'Graya Officiel — Chaîne YouTube',
  'Clips, freestyles et exclus sur la chaîne officielle.',
  'https://www.youtube.com/@GrayaOfficiel',
  'YouTube',
  now() - interval '2 days'
where not exists (select 1 from public.news_articles where title like 'Graya Officiel%');
