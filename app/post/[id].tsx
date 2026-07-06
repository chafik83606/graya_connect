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

import { PostCard } from '../../components/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import { createComment, fetchComments } from '../../lib/api/comments';
import { ensureUserProfile } from '../../lib/api/profile';
import { deletePost, fetchPostById, likePost, reportPost } from '../../lib/api/posts';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';
import type { Comment, Post } from '../../lib/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      setPost(await fetchPostById(id));
      setComments(await fetchComments(id));
    } catch (err) {
      setPost(null);
      setComments([]);
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSend = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour commenter.');
      return;
    }
    if (!id || !draft.trim()) return;
    setSending(true);
    try {
      await ensureUserProfile(user.id, user.user_metadata);
      const comment = await createComment(id, user.id, draft);
      setComments((c) => [...c, comment]);
      setDraft('');
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const prev = post.likes_count;
    setPost({ ...post, likes_count: prev + 1 });
    try {
      await likePost(post.id, prev);
    } catch {
      setPost({ ...post, likes_count: prev });
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await deletePost(post.id);
      router.back();
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    }
  };

  const handleReport = async (reason?: string) => {
    if (!user || !post) return;
    try {
      await reportPost(post.id, user.id, reason);
      Alert.alert('Signalement envoyé', 'Merci, nous examinerons ce contenu.');
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
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
        <Text style={styles.headerTitle}>Publication</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          loadError ? (
            <Text style={styles.error}>{loadError}</Text>
          ) : post ? (
            <View>
              <PostCard
                post={post}
                currentUserId={user?.id}
                isArtist={profile?.is_artist}
                onLike={handleLike}
                onDelete={handleDelete}
                onReport={handleReport}
              />
              <Text style={styles.commentsTitle}>Commentaires ({comments.length})</Text>
            </View>
          ) : (
            <Text style={styles.error}>Post introuvable</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Text style={styles.commentAuthor}>
              {item.profile?.display_name ?? 'Fan'}
            </Text>
            <Text style={styles.commentContent}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyComments}>Aucun commentaire. Soyez le premier !</Text>
        }
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ajouter un commentaire..."
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
  list: { paddingBottom: spacing.md },
  commentsTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  commentCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentAuthor: { color: colors.primary, fontWeight: '600', marginBottom: 4 },
  commentContent: { color: colors.text, fontSize: 14, lineHeight: 20 },
  emptyComments: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  error: { color: colors.error, textAlign: 'center', margin: spacing.lg },
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
