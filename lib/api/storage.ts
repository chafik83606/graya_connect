import { supabase } from '../supabase';

export async function uploadPostImage(userId: string, uri: string): Promise<string> {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${userId}/${Date.now()}.${extension}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from('post-images').upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from('post-images').upload(path, arrayBuffer, {
    contentType,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}
