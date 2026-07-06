import { supabase } from '../supabase';
import type { OfficialChatMessage, Profile } from '../types';

type OfficialChatRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile | Profile[] | null;
};

function mapMessage(row: OfficialChatRow): OfficialChatMessage {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: profile ?? undefined,
  };
}

export async function fetchOfficialChatMessages(): Promise<OfficialChatMessage[]> {
  const { data, error } = await supabase
    .from('official_chat_messages')
    .select(
      'id, user_id, content, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data as OfficialChatRow[]).map(mapMessage);
}

export async function sendOfficialChatMessage(
  userId: string,
  content: string,
): Promise<OfficialChatMessage> {
  const { data, error } = await supabase
    .from('official_chat_messages')
    .insert({ user_id: userId, content: content.trim() })
    .select(
      'id, user_id, content, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .single();

  if (error) throw error;
  return mapMessage(data as OfficialChatRow);
}

export async function fetchOfficialChatPreview(): Promise<string | null> {
  const { data, error } = await supabase
    .from('official_chat_messages')
    .select('content')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.content ?? null;
}
