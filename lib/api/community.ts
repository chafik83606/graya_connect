import { supabase } from '../supabase';
import type { CommunityGroup, Event, GroupMessage, Profile } from '../types';

type GroupMessageRow = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile | Profile[] | null;
};

function mapGroupMessage(row: GroupMessageRow): GroupMessage {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    group_id: row.group_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    profile: profile ?? undefined,
  };
}

export async function fetchGroups(userId: string): Promise<CommunityGroup[]> {
  const { data: groups, error } = await supabase
    .from('community_groups')
    .select('id, name, description, member_count')
    .order('name');

  if (error) throw error;

  const { data: memberships } = await supabase
    .from('group_memberships')
    .select('group_id')
    .eq('user_id', userId);

  const joined = new Set(memberships?.map((m) => m.group_id) ?? []);

  return (groups ?? []).map((g) => ({
    ...g,
    is_member: joined.has(g.id),
  }));
}

export async function fetchGroupById(
  groupId: string,
  userId: string,
): Promise<CommunityGroup | null> {
  const { data, error } = await supabase
    .from('community_groups')
    .select('id, name, description, member_count')
    .eq('id', groupId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: membership } = await supabase
    .from('group_memberships')
    .select('group_id')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .maybeSingle();

  return { ...data, is_member: Boolean(membership) };
}

export async function fetchGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from('group_messages')
    .select(
      'id, group_id, user_id, content, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as GroupMessageRow[]).map(mapGroupMessage);
}

export async function sendGroupMessage(
  groupId: string,
  userId: string,
  content: string,
): Promise<GroupMessage> {
  const { data, error } = await supabase
    .from('group_messages')
    .insert({ group_id: groupId, user_id: userId, content: content.trim() })
    .select(
      'id, group_id, user_id, content, created_at, profiles(id, username, display_name, bio, avatar_url, is_artist, followers_count, following_count, created_at)',
    )
    .single();

  if (error) throw error;
  return mapGroupMessage(data as GroupMessageRow);
}

export async function joinGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('group_memberships')
    .insert({ user_id: userId, group_id: groupId });
  if (error) throw error;
}

export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('group_memberships')
    .delete()
    .eq('user_id', userId)
    .eq('group_id', groupId);
  if (error) throw error;
}

export async function fetchEvents(userId: string): Promise<(Event & { is_registered?: boolean })[]> {
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, location, event_date, image_url, ticket_url')
    .order('event_date', { ascending: true });

  if (error) throw error;

  const registered = new Set<string>();
  const { data: rsvps, error: rsvpError } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('user_id', userId);

  if (!rsvpError && rsvps) {
    for (const r of rsvps) registered.add(r.event_id);
  }

  return (events ?? []).map((e) => ({
    ...(e as Event),
    is_registered: registered.has(e.id),
  }));
}

export async function registerForEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase.from('event_rsvps').insert({ user_id: userId, event_id: eventId });
  if (error) throw error;
}

export async function unregisterFromEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
  if (error) throw error;
}
