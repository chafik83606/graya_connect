import { supabase } from '../supabase';
import type { Post, Profile } from '../types';

type PostRow = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: Profile | Profile[] | null;
};

function mapPost(row: PostRow): Post {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    image_url: row.image_url,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    created_at: row.created_at,
    profile: profile ?? undefined,
  };
}

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, likes_count, comments_count, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as PostRow[]).map(mapPost);
}

export async function createPost(
  userId: string,
  content: string,
  imageUrl?: string | null,
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: content.trim(),
      image_url: imageUrl ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return {
    ...(data as Post),
    profile: profile as Profile | undefined,
  };
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, content, image_url, likes_count, comments_count, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .eq('id', postId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPost(data as PostRow);
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function reportPost(
  postId: string,
  reporterId: string,
  reason = 'Contenu inapproprié',
): Promise<void> {
  const { error } = await supabase.from('post_reports').insert({
    post_id: postId,
    reporter_id: reporterId,
    reason,
  });
  if (error) throw error;
}

export async function likePost(postId: string, currentLikes: number): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ likes_count: currentLikes + 1 })
    .eq('id', postId);

  if (error) throw error;
}
