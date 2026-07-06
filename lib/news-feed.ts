import type { NewsArticle } from './types';

export function normalizeNewsUrl(url: string | null) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      const videoId =
        parsed.searchParams.get('v') ??
        (parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : '');
      return videoId ? `youtube:${videoId}` : url.toLowerCase();
    }
    if (parsed.hostname.includes('instagram.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const type = parts[0];
      const code = parts[1];
      if (code && (type === 'p' || type === 'reel' || type === 'tv')) {
        return `instagram:${code}`;
      }
    }
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function mergeNewsArticles(...groups: NewsArticle[][]): NewsArticle[] {
  const seen = new Set<string>();
  const merged: NewsArticle[] = [];

  for (const group of groups) {
    for (const article of group) {
      const key = normalizeNewsUrl(article.url) || article.id;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(article);
    }
  }

  return merged.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
}
