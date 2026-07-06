-- Graya Connect — Discussions de groupe
-- Exécutez ce script dans SQL Editor APRÈS setup-complete.sql

-- Description des groupes
alter table public.community_groups add column if not exists description text;

update public.community_groups set description = 'Le groupe officiel des fans de Graya. Actualités, exclus et discussions entre fans.'
where id = 'fans-officiels' and (description is null or description = '');

update public.community_groups set description = 'Rejoins la Street Team pour promouvoir Graya dans ta ville et participer aux actions sur le terrain.'
where id = 'street-team' and (description is null or description = '');

update public.community_groups set description = 'Concours, giveaways et jeux exclus réservés aux membres. Reste à l''affût des prochaines surprises !'
where id = 'concours' and (description is null or description = '');

-- Messages de groupe
create table if not exists public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id text references public.community_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.group_messages enable row level security;

grant select, insert on public.group_messages to authenticated;

drop policy if exists "Membres lisent messages groupe" on public.group_messages;
create policy "Membres lisent messages groupe" on public.group_messages
  for select to authenticated
  using (exists (
    select 1 from public.group_memberships gm
    where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()
  ));

drop policy if exists "Membres envoient message groupe" on public.group_messages;
create policy "Membres envoient message groupe" on public.group_messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_memberships gm
      where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()
    )
  );
