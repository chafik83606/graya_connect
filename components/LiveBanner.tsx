import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../lib/theme';
import type { LiveSession } from '../lib/types';

type LiveBannerProps = {
  live: LiveSession;
};

export function LiveBanner({ live }: LiveBannerProps) {
  return (
    <Pressable
      style={styles.wrap}
      onPress={() =>
        router.push({
          pathname: '/live',
          params: {
            title: live.title,
            videoId: live.youtube_video_id ?? '',
            sessionId: live.source === 'artist' ? live.id : '',
          },
        })
      }
    >
      <LinearGradient
        colors={['#3A1200', colors.surface, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {live.thumbnail_url ? (
          <Image source={{ uri: live.thumbnail_url }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons name="videocam" size={28} color={colors.primary} />
          </View>
        )}

        <View style={styles.info}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>EN DIRECT</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {live.title}
          </Text>
          <Text style={styles.cta}>Regarder maintenant →</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    overflow: 'hidden',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumb: {
    width: 88,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  thumbFallback: {
    width: 88,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  liveLabel: {
    color: '#FF3B30',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
