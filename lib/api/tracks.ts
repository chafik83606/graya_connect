import { supabase } from '../supabase';
import type { Track } from '../types';

export async function fetchTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('id, title, artist, cover_url, audio_url, release_date, plays_count')
    .order('release_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Track[];
}

export async function incrementTrackPlays(trackId: string, currentPlays: number): Promise<void> {
  const { error } = await supabase
    .from('tracks')
    .update({ plays_count: currentPlays + 1 })
    .eq('id', trackId);

  if (error) throw error;
}
