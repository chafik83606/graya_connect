import { supabase } from '../supabase';
import type { ChatMessage, Conversation, Profile } from '../types';

function orderPair(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const otherIds = data.map((c) => (c.user_a === userId ? c.user_b : c.user_a));
  const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds);

  const profileMap = new Map((profiles as Profile[] | null)?.map((p) => [p.id, p]) ?? []);

  return data.map((c) => {
    const otherId = c.user_a === userId ? c.user_b : c.user_a;
    const profile = profileMap.get(otherId);
    return {
      id: c.id,
      other_user_id: otherId,
      participant_name: profile?.display_name ?? 'Utilisateur',
      participant_avatar: profile?.avatar_url ?? null,
      last_message: c.last_message ?? '',
      last_message_at: c.last_message_at,
    };
  });
}

export async function findOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<string> {
  const [user_a, user_b] = orderPair(userId, otherUserId);

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_a', user_a)
    .eq('user_b', user_b)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ user_a, user_b, last_message: '', last_message_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content: content.trim() })
    .select('id, conversation_id, sender_id, content, created_at')
    .single();

  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ last_message: content.trim(), last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data as ChatMessage;
}

export async function fetchUsersForMessaging(currentUserId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .order('display_name');

  if (error) throw error;
  return (data ?? []) as Profile[];
}
