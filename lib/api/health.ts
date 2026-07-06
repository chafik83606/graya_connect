import { supabase } from '../supabase';

/** Vérifie si migration-v2.sql a été exécuté (table comments). */
export async function isMigrationV2Ready(): Promise<boolean> {
  const { error } = await supabase.from('comments').select('id').limit(1);
  if (!error) return true;
  const code = 'code' in error ? String(error.code) : '';
  const message = error.message ?? '';
  if (code === '42P01' || message.includes('does not exist')) return false;
  // Table existe mais autre erreur (RLS, réseau…) — on considère qu'elle est là
  return true;
}
