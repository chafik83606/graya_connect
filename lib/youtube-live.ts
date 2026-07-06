import { youtubeConfig } from './youtube';

export type YouTubeLiveHit = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
};

/** Extract a YouTube video ID from a URL or raw ID. */
export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return url.pathname.slice(1).split('/')[0] || null;
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const fromQuery = url.searchParams.get('v');
      if (fromQuery) return fromQuery;

      const liveMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) return liveMatch[1];

      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];

      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYouTubeEmbedUrl(videoId?: string | null) {
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
  }
  return `https://www.youtube.com/embed/live_stream?channel=${youtubeConfig.channelId}&autoplay=1&playsinline=1&rel=0&modestbranding=1`;
}

/** Detect an active YouTube live on Graya's channel (requires API key). */
export async function fetchYouTubeLiveFromApi(): Promise<YouTubeLiveHit | null> {
  const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey || !youtubeConfig.channelId) return null;

  const params = new URLSearchParams({
    part: 'snippet',
    channelId: youtubeConfig.channelId,
    eventType: 'live',
    type: 'video',
    maxResults: '1',
    key: apiKey,
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        thumbnails?: { high?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  const item = payload.items?.[0];
  const videoId = item?.id?.videoId;
  const title = item?.snippet?.title;
  if (!videoId || !title) return null;

  return {
    videoId,
    title,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
  };
}
