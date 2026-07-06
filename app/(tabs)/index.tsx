import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ArtistBanner } from '../../components/ArtistBanner';
import { LiveBanner } from '../../components/LiveBanner';
import { MigrationBanner } from '../../components/MigrationBanner';
import { PostCard } from '../../components/PostCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../contexts/AuthContext';
import { deletePost, fetchPosts, likePost, reportPost } from '../../lib/api/posts';
import { fetchActiveLiveSession } from '../../lib/api/live';
import { fetchGrayaBannerProfile } from '../../lib/api/profile';
import { MOCK_POSTS } from '../../lib/mockData';
import { getErrorMessage } from '../../lib/errors';
import { useTabBarLayout } from '../../lib/layout';
import { isSupabaseConfigured } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { LiveSession, Post, Profile } from '../../lib/types';

export default function FeedScreen() {
  const { isDemoMode, user, profile } = useAuth();
  const { fabBottom, listPaddingBottom } = useTabBarLayout();
  const [posts, setPosts] = useState<Post[]>([]);
  const [artist, setArtist] = useState<Profile | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (isDemoMode || !isSupabaseConfigured) {
      setPosts(MOCK_POSTS);
      setArtist(null);
      setLiveSession(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [postsData, artistData, liveData] = await Promise.all([
        fetchPosts(),
        fetchGrayaBannerProfile(),
        fetchActiveLiveSession().catch(() => null),
      ]);
      setPosts(postsData);
      setArtist(artistData);
      setLiveSession(liveData);
    } catch (err) {
      setPosts([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (post: Post) => {
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id ? { ...item, likes_count: item.likes_count + 1 } : item,
      ),
    );

    if (!isDemoMode && isSupabaseConfigured) {
      try {
        await likePost(post.id, post.likes_count);
      } catch {
        setPosts((current) =>
          current.map((item) =>
            item.id === post.id ? { ...item, likes_count: post.likes_count } : item,
          ),
        );
      }
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((current) => current.filter((p) => p.id !== postId));
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    }
  };

  const handleReport = async (postId: string, reason?: string) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour signaler un post.');
      return;
    }
    try {
      await reportPost(postId, user.id, reason);
      Alert.alert('Signalement envoyé', 'Merci, nous examinerons ce contenu.');
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="GRAYA CONNECT" subtitle="Fil d'actualité" />
      <MigrationBanner />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {liveSession ? <LiveBanner live={liveSession} /> : null}
              <ArtistBanner artist={artist} />
              {isDemoMode ? (
                <View style={styles.demoBanner}>
                  <Text style={styles.demoText}>
                    Mode démo — connectez-vous pour les vraies données
                  </Text>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id}
              isArtist={profile?.is_artist}
              onLike={() => handleLike(item)}
              onComment={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
              onDelete={() => handleDelete(item.id)}
              onReport={(reason) => handleReport(item.id, reason)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Aucun post pour le moment. Soyez le premier !</Text>
          }
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => {
          if (isDemoMode) {
            router.push('/(auth)/login');
          } else if (user) {
            router.push('/create-post');
          } else {
            router.push('/(auth)/login');
          }
        }}
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  demoBanner: {
    backgroundColor: colors.primary + '22',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  demoText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: colors.error + '22',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    paddingTop: spacing.md,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
