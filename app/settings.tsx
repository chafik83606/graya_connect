import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { fetchUserSettings, setNotifyNewReleases } from '../lib/api/settings';
import { getErrorMessage } from '../lib/errors';
import { colors, radius, spacing } from '../lib/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifyReleases, setNotifyReleases] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const settings = await fetchUserSettings(user.id);
      setNotifyReleases(settings.notify_new_releases);
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleNotify = async (value: boolean) => {
    if (!user) return;
    try {
      await setNotifyNewReleases(user.id, value);
      setNotifyReleases(value);
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Nouvelles sorties</Text>
              <Text style={styles.rowSub}>Être notifié quand Graya sort un morceau</Text>
            </View>
            <Switch
              value={notifyReleases}
              onValueChange={toggleNotify}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Les notifications push arriveront dans une prochaine mise à jour. Votre choix est
              sauvegardé dans votre compte.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 17, fontWeight: '600' },
  headerSpacer: { width: 32 },
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: { flex: 1, marginRight: spacing.md },
  rowTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  rowSub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  infoBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
