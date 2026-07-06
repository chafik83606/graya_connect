import { supabase } from '../supabase';
import type { UserSettings } from '../types';

export async function fetchUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, notify_new_releases')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? { user_id: userId, notify_new_releases: false };
}

export async function setNotifyNewReleases(userId: string, enabled: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_settings')
      .update({ notify_new_releases: enabled, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_settings')
      .insert({ user_id: userId, notify_new_releases: enabled });
    if (error) throw error;
  }
}
