import type { NewsArticle } from './types';

const DEFAULT_CHANNEL_ID = 'UCKXEsEKicxBbPTZh7Qg3d_A';
const DEFAULT_MAX_VIDEOS = 8;

export const youtubeConfig = {
  channelId: process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID ?? DEFAULT_CHANNEL_ID,
  maxVideos: Number(process.env.EXPO_PUBLIC_YOUTUBE_MAX_VIDEOS ?? DEFAULT_MAX_VIDEOS) || DEFAULT_MAX_VIDEOS,
  sourceLabel: 'YouTube · Graya Officiel',
};

function decodeXml(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pickTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : null;
}

function pickAttr(block: string, tag: string, attr: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`));
  return match ? decodeXml(match[1]) : null;
}

function parseRssEntries(xml: string): NewsArticle[] {
  const entries = xml.split('<entry>').slice(1);
  const articles: NewsArticle[] = [];

  for (const raw of entries) {
    if (articles.length >= youtubeConfig.maxVideos) break;

    const block = raw.split('</entry>')[0] ?? raw;
    const videoId = pickTag(block, 'yt:videoId');
    const title = pickTag(block, 'title');
    const published = pickTag(block, 'published');
    if (!videoId || !title || !published) continue;

    const link =
      pickAttr(block, 'link', 'href') ?? `https://www.youtube.com/watch?v=${videoId}`;
    const summary = pickTag(block, 'media:description');
    const thumbnail =
      pickAttr(block, 'media:thumbnail', 'url') ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    articles.push({
      id: `youtube-${videoId}`,
      title,
      summary: summary ? summary.slice(0, 200) : 'Nouvelle vidéo sur la chaîne Graya Officiel.',
      url: link,
      source: youtubeConfig.sourceLabel,
      image_url: thumbnail,
      published_at: published,
      is_auto: true,
    });
  }

  return articles;
}

export async function fetchYouTubeVideos(): Promise<NewsArticle[]> {
  if (!youtubeConfig.channelId) return [];

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeConfig.channelId}`;
  const response = await fetch(feedUrl);
  if (!response.ok) {
    throw new Error(`YouTube RSS indisponible (${response.status})`);
  }

  const xml = await response.text();
  return parseRssEntries(xml);
}
