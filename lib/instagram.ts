import type { NewsArticle } from './types';

const DEFAULT_USERNAME = 'grayaofficial';
const DEFAULT_MAX_POSTS = 6;
const IG_APP_ID = '936619743392459';

export const instagramConfig = {
  username: process.env.EXPO_PUBLIC_INSTAGRAM_USERNAME ?? DEFAULT_USERNAME,
  accessToken: process.env.EXPO_PUBLIC_INSTAGRAM_ACCESS_TOKEN ?? '',
  maxPosts: Number(process.env.EXPO_PUBLIC_INSTAGRAM_MAX_POSTS ?? DEFAULT_MAX_POSTS) || DEFAULT_MAX_POSTS,
  sourceLabel: `Instagram · @${process.env.EXPO_PUBLIC_INSTAGRAM_USERNAME ?? DEFAULT_USERNAME}`,
};

type GraphMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

type GraphMediaResponse = {
  data?: GraphMediaItem[];
  error?: { message?: string };
};

function captionTitle(caption: string | undefined, mediaType: string | undefined) {
  const firstLine = caption?.split('\n').find((line) => line.trim())?.trim();
  if (firstLine) return firstLine.slice(0, 120);
  if (mediaType === 'VIDEO') return 'Nouvelle vidéo Instagram';
  if (mediaType === 'CAROUSEL_ALBUM') return 'Nouveau carousel Instagram';
  return 'Nouvelle publication Instagram';
}

function toNewsArticle(item: GraphMediaItem): NewsArticle | null {
  if (!item.id || !item.timestamp) return null;

  const imageUrl =
    item.media_type === 'VIDEO'
      ? item.thumbnail_url ?? item.media_url ?? null
      : item.media_url ?? item.thumbnail_url ?? null;

  return {
    id: `instagram-${item.id}`,
    title: captionTitle(item.caption, item.media_type),
    summary: item.caption?.slice(0, 200) ?? 'Publication sur le compte officiel Graya.',
    url: item.permalink ?? `https://www.instagram.com/${instagramConfig.username}/`,
    source: instagramConfig.sourceLabel,
    image_url: imageUrl,
    published_at: item.timestamp,
    is_auto: true,
  };
}

async function fetchViaGraphApi(): Promise<NewsArticle[]> {
  const token = instagramConfig.accessToken.trim();
  if (!token) return [];

  const fields =
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${instagramConfig.maxPosts}&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url);
  const payload = (await response.json()) as GraphMediaResponse;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Instagram API (${response.status})`);
  }

  return (payload.data ?? [])
    .map(toNewsArticle)
    .filter((article): article is NewsArticle => article !== null);
}

type WebProfileUser = {
  edge_owner_to_timeline_media?: {
    edges?: Array<{
      node?: {
        id?: string;
        shortcode?: string;
        display_url?: string;
        thumbnail_src?: string;
        taken_at_timestamp?: number;
        edge_media_to_caption?: { edges?: Array<{ node?: { text?: string } }> };
        is_video?: boolean;
      };
    }>;
  };
};

async function fetchViaPublicProfile(): Promise<NewsArticle[]> {
  const response = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(instagramConfig.username)}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        'X-IG-App-ID': IG_APP_ID,
      },
    },
  );

  if (response.status === 429) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Profil Instagram indisponible (${response.status})`);
  }

  const payload = (await response.json()) as { data?: { user?: WebProfileUser } };
  const edges = payload.data?.user?.edge_owner_to_timeline_media?.edges ?? [];

  return edges.slice(0, instagramConfig.maxPosts).flatMap((edge) => {
    const node = edge.node;
    if (!node?.shortcode || !node.taken_at_timestamp) return [];

    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text;
    const article: NewsArticle = {
      id: `instagram-${node.shortcode}`,
      title: captionTitle(caption, node.is_video ? 'VIDEO' : 'IMAGE'),
      summary: caption?.slice(0, 200) ?? 'Publication sur le compte officiel Graya.',
      url: `https://www.instagram.com/p/${node.shortcode}/`,
      source: instagramConfig.sourceLabel,
      image_url: node.display_url ?? node.thumbnail_src ?? null,
      published_at: new Date(node.taken_at_timestamp * 1000).toISOString(),
      is_auto: true,
    };
    return [article];
  });
}

/** Dernières publications Instagram (@grayaofficial par défaut). */
export async function fetchInstagramPosts(): Promise<NewsArticle[]> {
  if (instagramConfig.accessToken.trim()) {
    return fetchViaGraphApi();
  }
  return fetchViaPublicProfile();
}

export function isInstagramConfigured() {
  return Boolean(instagramConfig.accessToken.trim());
}
