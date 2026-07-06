import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import {
  fetchGroupById,
  fetchGroupMessages,
  joinGroup,
  leaveGroup,
  sendGroupMessage,
} from '../../lib/api/community';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';
import type { CommunityGroup, GroupMessage } from '../../lib/types';

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const groupData = await fetchGroupById(id, user.id);
      setGroup(groupData);
      if (groupData?.is_member) {
        setMessages(await fetchGroupMessages(id));
      } else {
        setMessages([]);
      }
    } catch (err) {
      setGroup(null);
      setMessages([]);
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJoinToggle = async () => {
    if (!user || !group) return;
    try {
      if (group.is_member) {
        await leaveGroup(user.id, group.id);
        Alert.alert('Groupe quitté', `Vous avez quitté "${group.name}".`);
      } else {
        await joinGroup(user.id, group.id);
        Alert.alert('Bienvenue !', `Vous avez rejoint "${group.name}".`);
      }
      await loadData();
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    }
  };

  const handleSend = async () => {
    if (!user || !id || !draft.trim() || !group?.is_member) return;
    setSending(true);
    try {
      const msg = await sendGroupMessage(id, user.id, draft);
      setMessages((m) => [...m, msg]);
      setDraft('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{loadError ?? 'Groupe introuvable'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <Pressable
          style={[styles.joinChip, group.is_member && styles.joinChipActive]}
          onPress={handleJoinToggle}
        >
          <Text style={[styles.joinChipText, group.is_member && styles.joinChipTextActive]}>
            {group.is_member ? 'Membre' : 'Rejoindre'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.about}>
            <View style={styles.aboutIcon}>
              <Ionicons name="people" size={28} color={colors.primary} />
            </View>
            <Text style={styles.aboutMembers}>
              {group.member_count.toLocaleString('fr-FR')} membres
            </Text>
            <Text style={styles.aboutDescription}>
              {group.description ?? 'Groupe de fans Graya Connect.'}
            </Text>
            <Text style={styles.discussionTitle}>Discussion</Text>
            {!group.is_member ? (
              <View style={styles.lockedBox}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <Text style={styles.lockedText}>
                  Rejoignez le groupe pour lire et participer à la discussion.
                </Text>
              </View>
            ) : null}
            {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
          </View>
        }
        renderItem={({ item }) => {
          const fromMe = item.user_id === user?.id;
          const author = item.profile?.display_name ?? 'Fan';
          return (
            <View style={[styles.messageRow, fromMe && styles.messageRowMe]}>
              {!fromMe ? <Text style={styles.messageAuthor}>{author}</Text> : null}
              <View style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, fromMe && styles.bubbleTextMe]}>
                  {item.content}
                </Text>
              </View>
              <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          group.is_member ? (
            <Text style={styles.empty}>Soyez le premier à écrire dans ce groupe !</Text>
          ) : null
        }
      />

      {group.is_member ? (
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Écrire dans le groupe..."
            placeholderTextColor={colors.textMuted}
          />
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="send" size={20} color={colors.background} />
            )}
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: { padding: spacing.xs },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  joinChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinChipActive: { backgroundColor: colors.primary + '22' },
  joinChipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  joinChipTextActive: { color: colors.primary },
  list: { padding: spacing.md, paddingBottom: spacing.md },
  about: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  aboutMembers: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  aboutDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  discussionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  lockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  lockedText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  messageRow: { marginBottom: spacing.md, maxWidth: '85%' },
  messageRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageAuthor: { color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bubbleMe: { backgroundColor: colors.primary },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: colors.background },
  messageTime: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  error: { color: colors.error, textAlign: 'center', marginTop: spacing.sm },
  backLink: { marginTop: spacing.md },
  backLinkText: { color: colors.primary, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
