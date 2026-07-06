import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MigrationBanner } from '../../components/MigrationBanner';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAudio } from '../../contexts/AudioContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserSettings, setNotifyNewReleases } from '../../lib/api/settings';
import { fetchTracks } from '../../lib/api/tracks';
import { getErrorMessage } from '../../lib/errors';
import { MOCK_TRACKS } from '../../lib/mockData';
import { isSupabaseConfigured } from '../../lib/supabase';
import { colors, radius, spacing } from '../../lib/theme';
import type { Track } from '../../lib/types';

function TrackItem({
  track,
  isActive,
  isPlaying,
  onPlay,
}: {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <Pressable style={[styles.trackCard, isActive && styles.trackCardActive]} onPress={onPlay}>
      <View style={styles.cover}>
        <Ionicons name="musical-note" size={28} color={colors.primary} />
      </View>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.trackArtist}>{track.artist}</Text>
        <Text style={styles.trackPlays}>{track.plays_count.toLocaleString('fr-FR')} écoutes</Text>
      </View>
      <Pressable style={styles.playButton} onPress={onPlay}>
        <Ionicons
          name={isActive && isPlaying ? 'pause' : 'play'}
          size={20}
          color={colors.background}
        />
      </Pressable>
    </Pressable>
  );
}

export default function MusicScreen() {
  const { isDemoMode, user } = useAuth();
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTracks = useCallback(async () => {
    if (isDemoMode || !isSupabaseConfigured) {
      setTracks(MOCK_TRACKS);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setTracks(await fetchTracks());
    } catch (err) {
      setTracks([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  const loadSettings = useCallback(async () => {
    if (!user || isDemoMode) return;
    try {
      const settings = await fetchUserSettings(user.id);
      setNotified(settings.notify_new_releases);
    } catch {
      setNotified(false);
    }
  }, [user, isDemoMode]);

  useFocusEffect(
    useCallback(() => {
      loadTracks();
      loadSettings();
    }, [loadTracks, loadSettings]),
  );

  const handleNotify = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour activer les notifications.');
      return;
    }

    const next = !notified;
    try {
      await setNotifyNewReleases(user.id, next);
      setNotified(next);
      Alert.alert(
        next ? 'Notification activée' : 'Notification désactivée',
        next
          ? 'Vous serez notifié des nouvelles sorties de Graya.'
          : 'Vous ne recevrez plus de notifications pour les sorties.',
      );
    } catch (error) {
      Alert.alert('Erreur', getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Musique" subtitle="Sorties & clips de Graya" />
      <MigrationBanner />

      <View style={styles.featured}>
        <Text style={styles.featuredLabel}>À la une</Text>
        <Text style={styles.featuredTitle}>Prochaine sortie</Text>
        <Text style={styles.featuredSub}>Bientôt disponible sur Graya Connect</Text>
        <Pressable
          style={[styles.notifyButton, notified && styles.notifyButtonActive]}
          onPress={handleNotify}
        >
          <Ionicons
            name={notified ? 'notifications' : 'notifications-outline'}
            size={18}
            color={notified ? colors.primary : colors.background}
          />
          <Text style={[styles.notifyText, notified && styles.notifyTextActive]}>
            {notified ? 'Notifié ✓' : 'Me notifier'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Discographie</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : tracks.length === 0 ? (
        <Text style={styles.empty}>Aucun morceau disponible pour le moment.</Text>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              isActive={currentTrack?.id === item.id}
              isPlaying={currentTrack?.id === item.id && isPlaying}
              onPlay={() => playTrack(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  featured: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  featuredLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featuredTitle: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: spacing.xs },
  featuredSub: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: spacing.md },
  notifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  notifyButtonActive: {
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  notifyText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  notifyTextActive: { color: colors.primary },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  loader: { marginTop: spacing.lg },
  list: { paddingHorizontal: spacing.md, paddingBottom: 120, gap: spacing.sm },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  trackCardActive: { borderColor: colors.primary },
  cover: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { flex: 1, marginLeft: spacing.md },
  trackTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  trackArtist: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  trackPlays: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
