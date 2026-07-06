import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../lib/theme';
import type { Post } from '../lib/types';

type PostCardProps = {
  post: Post;
  currentUserId?: string | null;
  isArtist?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
  onReport?: (reason?: string) => void;
};

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function PostCard({
  post,
  currentUserId,
  isArtist,
  onLike,
  onComment,
  onDelete,
  onReport,
}: PostCardProps) {
  const author = post.profile?.display_name ?? 'Utilisateur';
  const username = post.profile?.username ?? 'fan';
  const isOwner = Boolean(currentUserId && post.user_id === currentUserId);
  const canDelete = isOwner || isArtist;
  const isArtistPost = post.profile?.is_artist ?? false;

  const handleShare = async () => {
    await Share.share({
      message: `${author} sur Graya Connect :\n\n${post.content}`,
    });
  };

  const handleMenu = () => {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Annuler', style: 'cancel' },
    ];

    if (canDelete && onDelete) {
      options.unshift({
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Supprimer ce post ?', 'Cette action est définitive.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: onDelete },
          ]);
        },
      });
    }

    if (!isOwner && onReport) {
      options.unshift({
        text: 'Signaler',
        onPress: () => {
          Alert.alert('Signaler ce post', 'Pourquoi signalez-vous ce contenu ?', [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Contenu inapproprié',
              onPress: () => onReport('Contenu inapproprié'),
            },
            {
              text: 'Spam',
              onPress: () => onReport('Spam'),
            },
          ]);
        },
      });
    }

    if (options.length === 1) return;
    Alert.alert('Options', undefined, options);
  };

  return (
    <View style={[styles.card, isArtistPost && styles.cardArtist]}>
      <View style={styles.header}>
        {post.profile?.avatar_url ? (
          <Image source={{ uri: post.profile.avatar_url }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, isArtistPost && styles.avatarArtist]}>
            <Text style={styles.avatarText}>{author.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.author}>{author}</Text>
            {isArtistPost ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Artiste</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.handle}>@{username} · {formatTimeAgo(post.created_at)}</Text>
        </View>
        {(canDelete && onDelete) || (!isOwner && onReport) ? (
          <Pressable onPress={handleMenu} style={styles.menuBtn} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.image} contentFit="cover" />
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onLike}>
          <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardArtist: {
    borderColor: colors.primary + '55',
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarArtist: {
    backgroundColor: colors.primary,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 17,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  author: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  handle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  menuBtn: {
    padding: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
