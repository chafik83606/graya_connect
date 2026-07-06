import { supabase } from '../supabase';
import type { LiveSession } from '../types';
import { fetchYouTubeLiveFromApi, parseYouTubeVideoId } from '../youtube-live';

export type StartLiveInput = {
  title: string;
  youtubeUrl?: string | null;
};

export async function fetchActiveLiveSession(): Promise<LiveSession | null> {
  const artistLive = await fetchArtistActiveLive();
  if (artistLive) return artistLive;

  const youtubeLive = await fetchYouTubeLiveFromApi();
  if (!youtubeLive) return null;

  return {
    id: `youtube-${youtubeLive.videoId}`,
    title: youtubeLive.title,
    youtube_video_id: youtubeLive.videoId,
    youtube_url: `https://www.youtube.com/watch?v=${youtubeLive.videoId}`,
    is_active: true,
    started_at: new Date().toISOString(),
    ended_at: null,
    source: 'youtube',
    thumbnail_url: youtubeLive.thumbnailUrl,
  };
}

export async function fetchArtistActiveLive(): Promise<LiveSession | null> {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('id, title, youtube_video_id, youtube_url, is_active, started_at, ended_at')
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST205') return null;
    throw error;
  }
  if (!data) return null;
  return { ...(data as LiveSession), source: 'artist' };
}

export async function startLiveSession(input: StartLiveInput): Promise<LiveSession> {
  const title = input.title.trim() || 'Graya en direct';
  const youtubeUrl = input.youtubeUrl?.trim() || null;
  const youtubeVideoId = youtubeUrl ? parseYouTubeVideoId(youtubeUrl) : null;

  if (youtubeUrl && !youtubeVideoId) {
    throw new Error('Lien YouTube invalide. Collez un lien watch, live ou youtu.be.');
  }

  await supabase
    .from('live_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('live_sessions')
    .insert({
      title,
      youtube_video_id: youtubeVideoId,
      youtube_url: youtubeUrl,
      is_active: true,
    })
    .select('id, title, youtube_video_id, youtube_url, is_active, started_at, ended_at')
    .single();

  if (error) throw error;
  return { ...(data as LiveSession), source: 'artist' };
}

export async function endLiveSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('live_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}
