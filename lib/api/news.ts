import { supabase } from '../supabase';
import { fetchInstagramPosts, isInstagramConfigured } from '../instagram';
import { mergeNewsArticles } from '../news-feed';
import type { NewsArticle } from '../types';
import { fetchYouTubeVideos } from '../youtube';

export type CreateNewsInput = {
  title: string;
  summary?: string | null;
  url?: string | null;
  source?: string | null;
  imageUrl?: string | null;
};

export type NewsFeedResult = {
  articles: NewsArticle[];
  manualError: string | null;
  youtubeError: string | null;
  instagramError: string | null;
  instagramHint: string | null;
};

export async function fetchManualNewsArticles(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, summary, url, source, image_url, published_at')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as NewsArticle[];
}

/** Flux combiné : Supabase + YouTube + Instagram. */
export async function fetchNewsFeed(): Promise<NewsFeedResult> {
  let manual: NewsArticle[] = [];
  let youtube: NewsArticle[] = [];
  let instagram: NewsArticle[] = [];
  let manualError: string | null = null;
  let youtubeError: string | null = null;
  let instagramError: string | null = null;
  let instagramHint: string | null = null;

  const [manualResult, youtubeResult, instagramResult] = await Promise.allSettled([
    fetchManualNewsArticles(),
    fetchYouTubeVideos(),
    fetchInstagramPosts(),
  ]);

  if (manualResult.status === 'fulfilled') {
    manual = manualResult.value;
  } else {
    manualError =
      manualResult.reason instanceof Error
        ? manualResult.reason.message
        : 'Impossible de charger les actualités manuelles.';
  }

  if (youtubeResult.status === 'fulfilled') {
    youtube = youtubeResult.value;
  } else {
    youtubeError =
      youtubeResult.reason instanceof Error
        ? youtubeResult.reason.message
        : 'Impossible de charger les vidéos YouTube.';
  }

  if (instagramResult.status === 'fulfilled') {
    instagram = instagramResult.value;
    if (instagram.length === 0 && !isInstagramConfigured()) {
      instagramHint =
        'Instagram : ajoutez EXPO_PUBLIC_INSTAGRAM_ACCESS_TOKEN dans .env pour activer le flux auto (@grayaofficial).';
    }
  } else {
    instagramError =
      instagramResult.reason instanceof Error
        ? instagramResult.reason.message
        : 'Impossible de charger Instagram.';
    if (!isInstagramConfigured()) {
      instagramHint =
        'Instagram : configurez EXPO_PUBLIC_INSTAGRAM_ACCESS_TOKEN (Meta for Developers) pour un flux fiable.';
    }
  }

  return {
    articles: mergeNewsArticles(manual, youtube, instagram),
    manualError,
    youtubeError,
    instagramError,
    instagramHint,
  };
}

/** @deprecated Préférez fetchNewsFeed. */
export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const { articles } = await fetchNewsFeed();
  return articles;
}

export async function createNewsArticle(input: CreateNewsInput): Promise<NewsArticle> {
  const { data, error } = await supabase
    .from('news_articles')
    .insert({
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      url: input.url?.trim() || null,
      source: input.source?.trim() || null,
      image_url: input.imageUrl?.trim() || null,
    })
    .select('id, title, summary, url, source, image_url, published_at')
    .single();

  if (error) throw error;
  return data as NewsArticle;
}

export async function deleteNewsArticle(id: string): Promise<void> {
  const { error } = await supabase.from('news_articles').delete().eq('id', id);
  if (error) throw error;
}
