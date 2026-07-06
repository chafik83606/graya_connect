import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { findOrCreateConversation, fetchUsersForMessaging } from '../lib/api/messages';
import { getErrorMessage } from '../lib/errors';
import { colors, radius, spacing } from '../lib/theme';
import type { Profile } from '../lib/types';

export default function NewMessageScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setUsers(await fetchUsersForMessaging(user.id));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const startConversation = async (otherUser: Profile) => {
    if (!user) return;
    try {
      const conversationId = await findOrCreateConversation(user.id, otherUser.id);
      router.replace({ pathname: '/conversation/[id]', params: { id: conversationId } });
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
        <Text style={styles.title}>Nouveau message</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun autre membre pour le moment.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.userCard} onPress={() => startConversation(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.display_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{item.display_name}</Text>
                <Text style={styles.userHandle}>@{item.username}</Text>
              </View>
              {item.is_artist ? (
                <View style={styles.artistBadge}>
                  <Text style={styles.artistText}>Artiste</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
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
  list: { padding: spacing.md },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.background, fontWeight: '700', fontSize: 16 },
  userName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  userHandle: { color: colors.textMuted, fontSize: 13 },
  artistBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  artistText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
});
