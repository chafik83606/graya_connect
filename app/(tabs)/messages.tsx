import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LoginRequired } from '../../components/LoginRequired';
import { MigrationBanner } from '../../components/MigrationBanner';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../contexts/AuthContext';
import { fetchConversations } from '../../lib/api/messages';
import { fetchOfficialChatPreview } from '../../lib/api/officialChat';
import { getErrorMessage } from '../../lib/errors';
import { useTabBarLayout } from '../../lib/layout';
import { colors, radius, spacing } from '../../lib/theme';
import type { Conversation } from '../../lib/types';

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function HighlightCard({
  icon,
  title,
  subtitle,
  onPress,
  nested = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  nested?: boolean;
}) {
  return (
    <Pressable
      style={[styles.highlightCard, nested && styles.highlightCardNested]}
      onPress={onPress}
    >
      <View style={styles.highlightIcon}>
        <Ionicons name={icon} size={24} color={colors.background} />
      </View>
      <View style={styles.highlightInfo}>
        <Text style={styles.highlightTitle}>{title}</Text>
        <Text style={styles.highlightSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { user, isDemoMode } = useAuth();
  const { fabBottom, listPaddingBottom } = useTabBarLayout();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [generalPreview, setGeneralPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [convs, preview] = await Promise.all([
        fetchConversations(user.id),
        fetchOfficialChatPreview(),
      ]);
      setConversations(convs);
      setGeneralPreview(preview);
    } catch (err) {
      setConversations([]);
      setGeneralPreview(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const privateSubtitle =
    conversations.length > 0
      ? conversations[0].last_message || 'Conversation en cours'
      : 'Discuter en privé avec un autre fan';

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Messages" subtitle="Chat général & messages privés" />
        <LoginRequired
          title={isDemoMode ? 'Mode démo limité' : 'Connexion requise'}
          subtitle={
            isDemoMode
              ? 'Connectez-vous pour accéder au chat général et aux messages privés.'
              : 'Connectez-vous pour participer au chat et envoyer des messages.'
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Messages" subtitle="Chat général & messages privés" />
      <MigrationBanner />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <HighlightCard
            icon="megaphone"
            title="Chat général"
            subtitle={generalPreview ?? 'Espace ouvert — visible par tous les fans'}
            onPress={() => router.push('/official-chat')}
          />

          <View style={styles.highlightSection}>
            <HighlightCard
              icon="chatbubble-ellipses"
              title="Message privé"
              subtitle={privateSubtitle}
              onPress={() => router.push('/new-message')}
              nested
            />

            {conversations.length > 0 ? (
              <View style={styles.conversationList}>
                {conversations.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.conversationRow}
                    onPress={() =>
                      router.push({ pathname: '/conversation/[id]', params: { id: item.id } })
                    }
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.participant_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.conversationInfo}>
                      <Text style={styles.participantName}>{item.participant_name}</Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message || 'Nouvelle conversation'}
                      </Text>
                    </View>
                    <Text style={styles.time}>{formatMessageTime(item.last_message_at)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}

      <Pressable style={[styles.fab, { bottom: fabBottom }]} onPress={() => router.push('/new-message')}>
        <Ionicons name="create-outline" size={24} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  errorBanner: {
    backgroundColor: colors.error + '22',
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
  list: { padding: spacing.md, gap: spacing.md },
  highlightSection: {
    backgroundColor: colors.primary + '18',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    overflow: 'hidden',
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '18',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    gap: spacing.md,
  },
  highlightCardNested: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightInfo: { flex: 1 },
  highlightTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  highlightSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  conversationList: {
    borderTopWidth: 1,
    borderTopColor: colors.primary + '33',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  conversationInfo: { flex: 1, marginLeft: spacing.md },
  participantName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  lastMessage: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  time: { color: colors.textMuted, fontSize: 11 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
