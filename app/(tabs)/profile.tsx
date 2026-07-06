import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing } from '../../lib/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, isDemoMode, isLoading, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    if (!isDemoMode && user && !profile) {
      refreshProfile();
    }
  }, [isDemoMode, user, profile, refreshProfile]);

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!isDemoMode && isLoading && !profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName =
    profile?.display_name ?? (user?.user_metadata?.display_name as string | undefined) ?? 'Fan';
  const username =
    profile?.username ?? (user?.user_metadata?.username as string | undefined) ?? 'fan';
  const isArtist = profile?.is_artist ?? false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>

        {isArtist ? (
          <View style={styles.artistBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={styles.artistBadgeText}>Artiste vérifié</Text>
          </View>
        ) : (
          <View style={styles.fanBadge}>
            <Ionicons name="heart" size={14} color={colors.accent} />
            <Text style={styles.fanBadgeText}>Fan Graya</Text>
          </View>
        )}

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {(profile?.followers_count ?? 0).toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {(profile?.following_count ?? 0).toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.statLabel}>Abonnements</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {isArtist ? (
          <MenuItem
            icon="star"
            label="Espace artiste"
            highlight
            onPress={() => router.push('/artist-space')}
          />
        ) : null}
        <MenuItem
          icon="create-outline"
          label="Modifier le profil"
          onPress={() => router.push('/edit-profile')}
        />
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push('/settings')}
        />
        <MenuItem
          icon="settings-outline"
          label="Paramètres"
          onPress={() => router.push('/settings')}
        />
        <MenuItem
          icon="help-circle-outline"
          label="Aide & support"
          onPress={() =>
            Alert.alert('Aide & support', 'Contact : support@grayaconnect.com\n\nNous répondons sous 48h.')
          }
        />
      </View>

      {isDemoMode ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoText}>Vous êtes en mode démo (profil Graya fictif)</Text>
        </View>
      ) : null}

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  highlight,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  highlight?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.menuItem, highlight && styles.menuItemHighlight]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={highlight ? colors.primary : colors.textSecondary} />
      <Text style={[styles.menuLabel, highlight && styles.menuLabelHighlight]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.primaryDark,
  },
  avatarText: {
    color: colors.background,
    fontSize: 36,
    fontWeight: '800',
  },
  displayName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  username: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  artistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  artistBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  fanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: colors.accent + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  fanBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  menu: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  menuItemHighlight: {
    borderWidth: 1,
    borderColor: colors.primary + '55',
    backgroundColor: colors.primary + '12',
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  menuLabelHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  demoBanner: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.primary + '22',
    padding: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  demoText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error + '44',
  },
  signOutText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 15,
  },
});
