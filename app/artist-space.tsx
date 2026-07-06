import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import {
  createEvent,
  createTrack,
  deleteEvent,
  deleteTrack,
  fetchAllEvents,
  fetchAllTracks,
} from '../lib/api/artist';
import { createNewsArticle, deleteNewsArticle, fetchManualNewsArticles } from '../lib/api/news';
import {
  endLiveSession,
  fetchArtistActiveLive,
  startLiveSession,
} from '../lib/api/live';
import { getErrorMessage } from '../lib/errors';
import { parseFrenchDate, parseFrenchDateTime } from '../lib/dates';
import { colors, radius, spacing } from '../lib/theme';
import type { Event, LiveSession, NewsArticle, Track } from '../lib/types';

function formatEventDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActionCard({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function ArtistSpaceScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isDemoMode } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingTrack, setSavingTrack] = useState(false);
  const [savingNews, setSavingNews] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDay, setEventDay] = useState('');
  const [eventTime, setEventTime] = useState('20:00');
  const [ticketUrl, setTicketUrl] = useState('');

  const [trackTitle, setTrackTitle] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [releaseDay, setReleaseDay] = useState('');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsUrl, setNewsUrl] = useState('');
  const [newsSource, setNewsSource] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');

  const [activeLive, setActiveLive] = useState<LiveSession | null>(null);
  const [liveTitle, setLiveTitle] = useState('Graya en direct');
  const [liveUrl, setLiveUrl] = useState('');
  const [savingLive, setSavingLive] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, tracksData, newsData, liveData] = await Promise.all([
        fetchAllEvents(),
        fetchAllTracks(),
        fetchManualNewsArticles(),
        fetchArtistActiveLive().catch(() => null),
      ]);
      setEvents(eventsData);
      setTracks(tracksData);
      setNewsArticles(newsData);
      setActiveLive(liveData);
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profile?.is_artist && !isDemoMode) {
        loadData();
      }
    }, [profile?.is_artist, isDemoMode, loadData]),
  );

  if (!profile?.is_artist || isDemoMode) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        <Text style={styles.deniedTitle}>Espace réservé à Graya</Text>
        <Text style={styles.deniedText}>
          Seul le compte artiste peut accéder à cet espace. Contactez l'administrateur pour
          activer le statut artiste.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const handleAddEvent = async () => {
    if (!eventTitle.trim() || !eventLocation.trim() || !eventDay.trim()) {
      Alert.alert('Erreur', 'Remplissez le titre, le lieu et la date du concert.');
      return;
    }

    const eventDateIso = parseFrenchDateTime(eventDay, eventTime);
    if (!eventDateIso) {
      Alert.alert(
        'Date invalide',
        'Utilisez le format JJ/MM/AAAA pour la date et HH:MM pour l\'heure.\nEx: 20/06/2026 et 20:00',
      );
      return;
    }

    setSavingEvent(true);
    try {
      await createEvent({
        title: eventTitle,
        location: eventLocation,
        eventDate: eventDateIso,
        ticketUrl: ticketUrl.trim() || null,
      });
      setEventTitle('');
      setEventLocation('');
      setEventDay('');
      setEventTime('20:00');
      setTicketUrl('');
      await loadData();
      Alert.alert('Concert ajouté', 'Visible dans l\'onglet Communauté.');
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = (event: Event) => {
    Alert.alert('Supprimer', `Supprimer "${event.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(event.id);
            await loadData();
          } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleAddTrack = async () => {
    if (!trackTitle.trim() || !releaseDay.trim()) {
      Alert.alert('Erreur', 'Remplissez le titre et la date de sortie.');
      return;
    }

    const releaseDateIso = parseFrenchDate(releaseDay);
    if (!releaseDateIso) {
      Alert.alert('Date invalide', 'Utilisez le format JJ/MM/AAAA.\nEx: 01/06/2026');
      return;
    }

    setSavingTrack(true);
    try {
      await createTrack({
        title: trackTitle,
        audioUrl: audioUrl.trim() || null,
        releaseDate: releaseDateIso,
      });
      setTrackTitle('');
      setAudioUrl('');
      setReleaseDay('');
      await loadData();
      Alert.alert('Morceau ajouté', 'Visible dans l\'onglet Musique.');
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setSavingTrack(false);
    }
  };

  const handleDeleteTrack = (track: Track) => {
    Alert.alert('Supprimer', `Supprimer "${track.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrack(track.id);
            await loadData();
          } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleAddNews = async () => {
    if (!newsTitle.trim()) {
      Alert.alert('Erreur', 'Indiquez un titre pour l\'actualité.');
      return;
    }

    setSavingNews(true);
    try {
      await createNewsArticle({
        title: newsTitle,
        summary: newsSummary.trim() || null,
        url: newsUrl.trim() || null,
        source: newsSource.trim() || null,
        imageUrl: newsImageUrl.trim() || null,
      });
      setNewsTitle('');
      setNewsSummary('');
      setNewsUrl('');
      setNewsSource('');
      setNewsImageUrl('');
      await loadData();
      Alert.alert('Actualité publiée', 'Visible dans l\'onglet Actu.');
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setSavingNews(false);
    }
  };

  const handleStartLive = async () => {
    setSavingLive(true);
    try {
      const session = await startLiveSession({
        title: liveTitle,
        youtubeUrl: liveUrl.trim() || null,
      });
      setActiveLive(session);
      setLiveUrl('');
      Alert.alert(
        'Live lancé',
        'La bannière EN DIRECT apparaît sur le fil. Les fans peuvent regarder dans l\'app.',
      );
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    } finally {
      setSavingLive(false);
    }
  };

  const handleEndLive = () => {
    if (!activeLive) return;
    Alert.alert('Terminer le live', 'Retirer la bannière EN DIRECT de l\'app ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        style: 'destructive',
        onPress: async () => {
          try {
            await endLiveSession(activeLive.id);
            setActiveLive(null);
            Alert.alert('Live terminé', 'Le live n\'est plus visible dans l\'app.');
          } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleDeleteNews = (article: NewsArticle) => {
    Alert.alert('Supprimer', `Supprimer "${article.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNewsArticle(article.id);
            await loadData();
          } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Espace artiste</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Ionicons name="star" size={28} color={colors.primary} />
            <Text style={styles.heroTitle}>Gérez Graya Connect</Text>
            <Text style={styles.heroSub}>
              Bannière, annonces, actualités, live, concerts et musique — tout depuis ici.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Actions rapides</Text>
          <ActionCard
            icon="image-outline"
            label="Modifier la bannière (photo & bio)"
            onPress={() => router.push('/edit-profile')}
          />
          <ActionCard
            icon="megaphone-outline"
            label="Publier une annonce"
            onPress={() => router.push('/create-post')}
          />
          <ActionCard
            icon="videocam-outline"
            label="Regarder le live dans l'app"
            onPress={() =>
              router.push({
                pathname: '/live',
                params: {
                  title: activeLive?.title ?? 'Graya en direct',
                  videoId: activeLive?.youtube_video_id ?? '',
                },
              })
            }
          />

          <Text style={styles.sectionLabel}>Live YouTube</Text>
          <Text style={styles.sectionHint}>
            Lancez un live sur YouTube (Studio ou app YouTube), puis activez-le ici. Les fans verront
            une bannière EN DIRECT sur le fil avec le lecteur intégré.
          </Text>

          {activeLive ? (
            <View style={styles.liveActiveCard}>
              <View style={styles.liveActiveRow}>
                <View style={styles.liveActiveDot} />
                <Text style={styles.liveActiveLabel}>Live actif</Text>
              </View>
              <Text style={styles.listTitle}>{activeLive.title}</Text>
              <Text style={styles.listSub}>
                {activeLive.youtube_url ?? 'Chaîne YouTube Graya Officiel'}
              </Text>
              <Pressable style={styles.endLiveBtn} onPress={handleEndLive}>
                <Text style={styles.endLiveText}>Terminer le live</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={liveTitle}
              onChangeText={setLiveTitle}
              placeholder="Titre du live (ex: Session studio en direct)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={liveUrl}
              onChangeText={setLiveUrl}
              placeholder="Lien YouTube live (optionnel)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.fieldHint}>
              Laissez vide pour utiliser le live en cours sur @GrayaOfficiel.
            </Text>
            <Pressable
              style={[styles.submitBtn, savingLive && styles.submitDisabled]}
              onPress={handleStartLive}
              disabled={savingLive}
            >
              {savingLive ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.submitText}>Lancer le live dans l'app</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Actualités</Text>
          <Text style={styles.sectionHint}>
            YouTube (@GrayaOfficiel) et Instagram (@grayaofficial) se mettent à jour automatiquement dans Actu.
            Ajoutez ici articles presse, sorties, etc.
          </Text>
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={newsTitle}
              onChangeText={setNewsTitle}
              placeholder="Titre (ex: Nouveau clip Brouncha)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newsSummary}
              onChangeText={setNewsSummary}
              placeholder="Résumé court (optionnel)"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TextInput
              style={styles.input}
              value={newsUrl}
              onChangeText={setNewsUrl}
              placeholder="Lien (YouTube, article presse...)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={newsSource}
              onChangeText={setNewsSource}
              placeholder="Source (YouTube, Booska-P, La Provence...)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={newsImageUrl}
              onChangeText={setNewsImageUrl}
              placeholder="URL image (optionnel)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.submitBtn, savingNews && styles.submitDisabled]}
              onPress={handleAddNews}
              disabled={savingNews}
            >
              {savingNews ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.submitText}>Publier l'actualité</Text>
              )}
            </Pressable>
          </View>

          {newsArticles.map((article) => (
            <View key={article.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{article.title}</Text>
                <Text style={styles.listSub}>
                  {article.source ?? 'Sans source'}
                  {article.url ? ' · lien externe' : ''}
                </Text>
              </View>
              <Pressable onPress={() => handleDeleteNews(article)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}

          <Text style={styles.sectionLabel}>Concerts</Text>
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Titre (ex: Concert — Paris)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholder="Lieu (ex: La Cigale, Paris)"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.fieldLabel}>Date du concert</Text>
            <TextInput
              style={styles.input}
              value={eventDay}
              onChangeText={setEventDay}
              placeholder="JJ/MM/AAAA (ex: 20/06/2026)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.fieldLabel}>Heure</Text>
            <TextInput
              style={styles.input}
              value={eventTime}
              onChangeText={setEventTime}
              placeholder="HH:MM (ex: 20:00)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={styles.input}
              value={ticketUrl}
              onChangeText={setTicketUrl}
              placeholder="Lien billetterie (optionnel)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.submitBtn, savingEvent && styles.submitDisabled]}
              onPress={handleAddEvent}
              disabled={savingEvent}
            >
              {savingEvent ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.submitText}>Ajouter le concert</Text>
              )}
            </Pressable>
          </View>

          {events.map((event) => (
            <View key={event.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{event.title}</Text>
                <Text style={styles.listSub}>
                  {event.location} · {formatEventDate(event.event_date)}
                </Text>
                {event.ticket_url ? (
                  <Text style={styles.listLink} numberOfLines={1}>
                    Billetterie : {event.ticket_url}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => handleDeleteEvent(event)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}

          <Text style={styles.sectionLabel}>Morceaux</Text>
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={trackTitle}
              onChangeText={setTrackTitle}
              placeholder="Titre du morceau"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={audioUrl}
              onChangeText={setAudioUrl}
              placeholder="URL audio (MP3, SoundCloud...)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>Date de sortie</Text>
            <TextInput
              style={styles.input}
              value={releaseDay}
              onChangeText={setReleaseDay}
              placeholder="JJ/MM/AAAA (ex: 01/06/2026)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
            <Pressable
              style={[styles.submitBtn, savingTrack && styles.submitDisabled]}
              onPress={handleAddTrack}
              disabled={savingTrack}
            >
              {savingTrack ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.submitText}>Ajouter le morceau</Text>
              )}
            </Pressable>
          </View>

          {tracks.map((track) => (
            <View key={track.id} style={styles.listItem}>
              <View style={styles.listInfo}>
                <Text style={styles.listTitle}>{track.title}</Text>
                <Text style={styles.listSub}>
                  {track.plays_count.toLocaleString('fr-FR')} écoutes · {track.release_date}
                </Text>
              </View>
              <Pressable onPress={() => handleDeleteTrack(track)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  deniedTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: spacing.md },
  deniedText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  backBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  backBtnText: { color: colors.background, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.primary + '18',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.sm },
  heroSub: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  sectionLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
    marginTop: -4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  actionLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  liveActiveCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FF3B3055',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  liveActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  liveActiveLabel: {
    color: '#FF3B30',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  endLiveBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  endLiveText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.background, fontWeight: '700', fontSize: 15 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listInfo: { flex: 1 },
  listTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  listSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  listLink: { color: colors.primary, fontSize: 12, marginTop: 4 },
  deleteBtn: { padding: spacing.sm },
});
