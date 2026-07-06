import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { fetchConversations, fetchMessages, sendMessage } from '../../lib/api/messages';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';
import type { ChatMessage } from '../../lib/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [participantName, setParticipantName] = useState('Conversation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const conversations = await fetchConversations(user.id);
      const current = conversations.find((c) => c.id === id);
      if (current) {
        setParticipantName(current.participant_name);
      }
      setMessages(await fetchMessages(id));
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSend = async () => {
    if (!user || !id || !draft.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage(id, user.id, draft);
      setMessages((m) => [...m, msg]);
      setDraft('');
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
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
        <Text style={styles.headerTitle}>{participantName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const fromMe = item.sender_id === user?.id;
          return (
            <View style={[styles.bubble, fromMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, fromMe && styles.bubbleTextMe]}>{item.content}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Envoyez le premier message !</Text>
        }
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Votre message..."
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
  headerTitle: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 17, fontWeight: '600' },
  headerSpacer: { width: 32 },
  messagesList: { padding: spacing.md, flexGrow: 1 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: colors.background },
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
