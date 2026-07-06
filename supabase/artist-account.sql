-- Graya Connect — Comptes admin / artiste automatiques
-- Exécutez (ou ré-exécutez) dans SQL Editor
--
-- Les emails listés ci-dessous obtiennent is_artist = true à la connexion
-- → accès à l'Espace artiste (concerts, musique, bannière…)

create table if not exists public.artist_emails (
  email text primary key,
  role_label text not null default 'admin'
);

alter table public.artist_emails enable row level security;

-- Comptes autorisés (ajoutez une ligne par admin)
insert into public.artist_emails (email, role_label) values
  ('graya.gestion@gmail.com', 'graya'),
  ('ctre23@hotmail.com', 'admin')
on conflict (email) do update set role_label = excluded.role_label;

create or replace function public.sync_artist_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  user_email text;
  user_role text;
begin
  uid := auth.uid();
  if uid is null then
    return;
  end if;

  select email into user_email from auth.users where id = uid;

  select role_label into user_role
  from public.artist_emails
  where lower(email) = lower(user_email);

  if user_role is null then
    return;
  end if;

  -- Tous les comptes admin → statut artiste (Espace artiste)
  update public.profiles
  set is_artist = true
  where id = uid;

-- Profil officiel Graya uniquement pour son email
  if user_role = 'graya' then
    update public.profiles
    set
      is_artist = true,
      display_name = coalesce(nullif(trim(display_name), ''), 'Graya'),
      bio = coalesce(nullif(trim(bio), ''), 'Rappeur · Artiste · Graya Connect')
    where id = uid;

    if not exists (select 1 from public.profiles where username = 'graya' and id != uid) then
      update public.profiles
      set username = 'graya'
      where id = uid and (username like 'fan_%' or username = split_part(user_email, '@', 1));
    end if;
  end if;
end;
$$;

grant execute on function public.sync_artist_account() to authenticated;

-- Nettoyage ancienne config (optionnel)
delete from public.app_settings where key = 'artist_email';
