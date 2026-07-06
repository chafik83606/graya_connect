import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isMigrationV2Ready } from '../lib/api/health';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { colors, radius, spacing } from '../lib/theme';

export function MigrationBanner() {
  const { isDemoMode } = useAuth();
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || isDemoMode) {
      setNeedsMigration(false);
      return;
    }
    isMigrationV2Ready().then((ready) => setNeedsMigration(!ready));
  }, [isDemoMode]);

  if (!needsMigration) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Configuration Supabase incomplète</Text>
      <Text style={styles.text}>
        Exécutez le fichier supabase/setup-complete.sql dans le SQL Editor de Supabase pour
        activer commentaires, messages et communauté.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.error + '22',
    borderWidth: 1,
    borderColor: colors.error + '66',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  title: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
