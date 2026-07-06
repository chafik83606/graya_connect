import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GRAYA_PROFILE } from '../lib/mockData';
import { colors, radius, spacing } from '../lib/theme';
import type { Profile } from '../lib/types';

type ArtistBannerProps = {
  artist?: Profile | null;
};

export function ArtistBanner({ artist }: ArtistBannerProps) {
  const profile = artist ?? GRAYA_PROFILE;
  const initial = profile.display_name.charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={[colors.primary + '33', colors.surface, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={styles.avatarWrap}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.verifiedDot}>
          <Ionicons name="checkmark" size={12} color={colors.background} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{profile.display_name}</Text>
        <View style={styles.badgeRow}>
          <Ionicons name="mic" size={12} color={colors.primary} />
          <Text style={styles.badge}>Artiste · Graya Connect</Text>
        </View>
        <Text style={styles.bio} numberOfLines={2}>
          {profile.bio ?? 'Rappeur · Artiste · Le réseau des fans'}
        </Text>
        <Text style={styles.followers}>
          {profile.followers_count.toLocaleString('fr-FR')} abonnés
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    gap: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  avatarInitial: {
    color: colors.background,
    fontSize: 32,
    fontWeight: '800',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  info: { flex: 1 },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  badge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  followers: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});
