-- Graya Connect v2 — Commentaires, messages, groupes, paramètres
-- Exécutez ce script dans SQL Editor APRÈS schema.sql et fix-rls.sql

-- === COMMENTAIRES ===
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- === MESSAGERIE ===
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- === GROUPES COMMUNAUTÉ ===
create table if not exists public.community_groups (
  id text primary key,
  name text not null,
  member_count integer default 0
);

create table if not exists public.group_memberships (
  user_id uuid references public.profiles(id) on delete cascade,
  group_id text references public.community_groups(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (user_id, group_id)
);

insert into public.community_groups (id, name, member_count) values
  ('fans-officiels', 'Fans officiels', 12400),
  ('street-team', 'Street Team', 3200),
  ('concours', 'Concours & giveaways', 8900)
on conflict (id) do nothing;

-- === RSVP ÉVÉNEMENTS ===
create table if not exists public.event_rsvps (
  user_id uuid references public.profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, event_id)
);

-- === PARAMÈTRES UTILISATEUR ===
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notify_new_releases boolean default false,
  updated_at timestamptz default now()
);

-- Données événements si vides
insert into public.events (title, location, event_date)
select 'Concert — Paris', 'La Cigale, Paris', '2026-03-15T20:00:00Z'::timestamptz
where not exists (select 1 from public.events where title = 'Concert — Paris');

insert into public.events (title, location, event_date)
select 'Meet & Greet Fans', 'Marseille', '2026-04-02T18:00:00Z'::timestamptz
where not exists (select 1 from public.events where title = 'Meet & Greet Fans');

-- === RLS ===
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.community_groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.user_settings enable row level security;

-- Grants
grant select on public.comments to anon, authenticated;
grant insert on public.comments to authenticated;
grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select on public.community_groups to anon, authenticated;
grant select, insert, delete on public.group_memberships to authenticated;
grant select, insert, delete on public.event_rsvps to authenticated;
grant select, insert, update on public.user_settings to authenticated;

-- Comments
drop policy if exists "Commentaires visibles par tous" on public.comments;
create policy "Commentaires visibles par tous" on public.comments for select using (true);
drop policy if exists "Utilisateur peut commenter" on public.comments;
create policy "Utilisateur peut commenter" on public.comments for insert to authenticated with check (auth.uid() = user_id);

-- Conversations
drop policy if exists "Voir ses conversations" on public.conversations;
create policy "Voir ses conversations" on public.conversations for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "Créer conversation" on public.conversations;
create policy "Créer conversation" on public.conversations for insert to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "Mettre à jour conversation" on public.conversations;
create policy "Mettre à jour conversation" on public.conversations for update to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Chat messages
drop policy if exists "Voir messages de ses conversations" on public.chat_messages;
create policy "Voir messages de ses conversations" on public.chat_messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
  ));
drop policy if exists "Envoyer message" on public.chat_messages;
create policy "Envoyer message" on public.chat_messages for insert to authenticated
  with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Groups
drop policy if exists "Groupes visibles" on public.community_groups;
create policy "Groupes visibles" on public.community_groups for select using (true);
drop policy if exists "Rejoindre groupe" on public.group_memberships;
create policy "Rejoindre groupe" on public.group_memberships for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Voir ses groupes" on public.group_memberships;
create policy "Voir ses groupes" on public.group_memberships for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Quitter groupe" on public.group_memberships;
create policy "Quitter groupe" on public.group_memberships for delete to authenticated using (auth.uid() = user_id);

-- Event RSVPs
drop policy if exists "Voir ses RSVP" on public.event_rsvps;
create policy "Voir ses RSVP" on public.event_rsvps for select to authenticated using (auth.uid() = user_id);
drop policy if exists "RSVP événement" on public.event_rsvps;
create policy "RSVP événement" on public.event_rsvps for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Annuler RSVP" on public.event_rsvps;
create policy "Annuler RSVP" on public.event_rsvps for delete to authenticated using (auth.uid() = user_id);

-- Settings
drop policy if exists "Voir ses paramètres" on public.user_settings;
create policy "Voir ses paramètres" on public.user_settings for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Modifier ses paramètres" on public.user_settings;
create policy "Modifier ses paramètres" on public.user_settings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Mettre à jour ses paramètres" on public.user_settings;
create policy "Mettre à jour ses paramètres" on public.user_settings for update to authenticated using (auth.uid() = user_id);

-- === COMPTE ARTISTE GRAYA ===
-- Après que Graya crée son compte, exécutez (remplacez l'email) :
-- UPDATE public.profiles SET is_artist = true, display_name = 'Graya', username = 'graya', bio = 'Rappeur · Artiste · Graya Connect'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'graya@email.com' LIMIT 1);
