-- Graya Connect — Chat officiel (visible par tous les fans connectés)
-- Exécutez ce script dans SQL Editor

create table if not exists public.official_chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.official_chat_messages enable row level security;

grant select on public.official_chat_messages to anon, authenticated;
grant insert on public.official_chat_messages to authenticated;

drop policy if exists "Chat officiel visible par tous" on public.official_chat_messages;
create policy "Chat officiel visible par tous" on public.official_chat_messages
  for select using (true);

drop policy if exists "Fans peuvent écrire dans le chat officiel" on public.official_chat_messages;
create policy "Fans peuvent écrire dans le chat officiel" on public.official_chat_messages
  for insert to authenticated
  with check (auth.uid() = user_id);
