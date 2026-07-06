import { GRAYA_PROFILE } from '../mockData';
import { supabase } from '../supabase';
import type { Profile } from '../types';

/** Username du seul profil artiste public : Graya. */
export const GRAYA_USERNAME = 'graya';

export async function ensureUserProfile(
  userId: string,
  metadata?: Record<string, unknown>,
): Promise<Profile> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) {
    await syncArtistAccount();
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return (refreshed ?? existing) as Profile;
  }

  const username =
    (metadata?.username as string | undefined) ??
    (metadata?.display_name as string | undefined) ??
    `fan_${userId.slice(0, 8)}`;

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username,
      display_name: username,
      is_artist: false,
    })
    .select('*')
    .single();

  if (error) throw error;

  await syncArtistAccount();
  const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return (refreshed ?? created) as Profile;
}

/** Promote le compte connecté en artiste si son email correspond à app_settings.artist_email */
export async function syncArtistAccount(): Promise<void> {
  const { error } = await supabase.rpc('sync_artist_account');
  if (error && !error.message.includes('does not exist')) {
    throw error;
  }
}

/** Profil public de Graya (@graya) — pas les comptes admin de test. */
export async function fetchArtistProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', GRAYA_USERNAME)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/** Profil affiché sur le fil : Graya en base ou placeholder officiel. */
export async function fetchGrayaBannerProfile(): Promise<Profile> {
  const artist = await fetchArtistProfile();
  return artist ?? GRAYA_PROFILE;
}
