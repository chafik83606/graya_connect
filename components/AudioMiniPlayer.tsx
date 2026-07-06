import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAudio } from '../contexts/AudioContext';
import { useTabBarLayout } from '../lib/layout';
import { colors, radius, spacing } from '../lib/theme';

export function AudioMiniPlayer() {
  const { miniPlayerBottom } = useTabBarLayout();
  const { currentTrack, isPlaying, togglePlayPause, stop } = useAudio();

  if (!currentTrack) return null;

  return (
    <View style={[styles.container, { bottom: miniPlayerBottom }]}>
      <View style={styles.info}>
        <Ionicons name="musical-notes" size={18} color={colors.primary} />
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={togglePlayPause} style={styles.controlButton}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={colors.text} />
        </Pressable>
        <Pressable onPress={stop} style={styles.controlButton}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  artist: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  controlButton: {
    padding: spacing.xs,
  },
});
