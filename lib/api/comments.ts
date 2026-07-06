import { supabase } from '../supabase';
import type { Comment, Profile } from '../types';

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile | Profile[] | null;
};

function mapComment(row: CommentRow): Comment {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: profile ?? undefined,
  };
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, post_id, user_id, content, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as CommentRow[]).map(mapComment);
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content: content.trim() })
    .select(
      'id, post_id, user_id, content, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .single();

  if (error) throw error;

  const { data: post } = await supabase
    .from('posts')
    .select('comments_count')
    .eq('id', postId)
    .single();

  if (post) {
    await supabase
      .from('posts')
      .update({ comments_count: (post.comments_count ?? 0) + 1 })
      .eq('id', postId);
  }

  return mapComment(data as CommentRow);
}
