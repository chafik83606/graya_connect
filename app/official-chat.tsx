import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { useAuth } from '../contexts/AuthContext';
import { fetchOfficialChatMessages, sendOfficialChatMessage } from '../lib/api/officialChat';
import { getErrorMessage } from '../lib/errors';
import { colors, radius, spacing } from '../lib/theme';
import type { OfficialChatMessage } from '../lib/types';

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OfficialChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<OfficialChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setMessages(await fetchOfficialChatMessages());
    } catch (err) {
      setMessages([]);
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour écrire dans le chat général.');
      return;
    }
    if (!draft.trim()) return;

    setSending(true);
    try {
      const msg = await sendOfficialChatMessage(user.id, draft);
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat général</Text>
          <Text style={styles.headerSub}>Visible par tous les fans</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <View style={styles.infoBox}>
            <Ionicons name="megaphone-outline" size={22} color={colors.primary} />
            <Text style={styles.infoText}>
              Espace public Graya Connect. Tous les fans peuvent lire et participer. Les messages
              de Graya apparaissent avec le badge Artiste.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const fromMe = item.user_id === user?.id;
          const author = item.profile?.display_name ?? 'Fan';
          const isArtist = item.profile?.is_artist ?? false;

          return (
            <View style={[styles.messageRow, fromMe && styles.messageRowMe]}>
              {!fromMe ? (
                <View style={styles.authorRow}>
                  <Text style={styles.messageAuthor}>{author}</Text>
                  {isArtist ? (
                    <View style={styles.artistBadge}>
                      <Text style={styles.artistBadgeText}>Artiste</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
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
          <Text style={styles.empty}>
            Aucun message pour l'instant. Lancez la conversation !
          </Text>
        }
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={user ? 'Écrire dans le chat général...' : 'Connectez-vous pour écrire...'}
          placeholderTextColor={colors.textMuted}
          editable={Boolean(user)}
        />
        <Pressable
          style={[styles.sendButton, !user && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending || !user}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Ionicons name="send" size={20} color={colors.background} />
          )}
        </Pressable>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  headerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  headerSpacer: { width: 32 },
  errorBanner: {
    backgroundColor: colors.error + '22',
    margin: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.md },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primary + '15',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  messageRow: { marginBottom: spacing.md, maxWidth: '88%' },
  messageRowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  messageAuthor: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  artistBadge: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  artistBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  bubble: { padding: spacing.md, borderRadius: radius.md },
  bubbleMe: { backgroundColor: colors.primary },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: colors.background },
  messageTime: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
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
  sendButtonDisabled: { opacity: 0.5 },
});
