import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LoginRequired } from '../../components/LoginRequired';
import { MigrationBanner } from '../../components/MigrationBanner';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchEvents,
  fetchGroups,
  joinGroup,
  leaveGroup,
  registerForEvent,
} from '../../lib/api/community';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';
import type { CommunityGroup, Event } from '../../lib/types';

function formatEventDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type EventWithRsvp = Event & { is_registered?: boolean };

export default function CommunityScreen() {
  const { user, isDemoMode } = useAuth();
  const [events, setEvents] = useState<EventWithRsvp[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
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
      const [eventsData, groupsData] = await Promise.all([
        fetchEvents(user.id),
        fetchGroups(user.id),
      ]);
      setEvents(eventsData);
      setGroups(groupsData);
    } catch (err) {
      setEvents([]);
      setGroups([]);
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

  if (!user) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Communauté" subtitle="Événements & groupes fans" />
        <LoginRequired
          title={isDemoMode ? 'Mode démo limité' : 'Connexion requise'}
          subtitle={
            isDemoMode
              ? 'La communauté nécessite un vrai compte. Connectez-vous pour rejoindre des groupes et des événements.'
              : 'Connectez-vous pour accéder aux événements et groupes fans.'
          }
        />
      </View>
    );
  }

  const handleEventPress = async (event: EventWithRsvp) => {
    const message = `${event.location}\n${formatEventDate(event.event_date)}${
      event.is_registered ? '\n\n✓ Vous êtes inscrit' : ''
    }`;

    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Fermer', style: 'cancel' },
    ];

    if (event.ticket_url) {
      buttons.unshift({
        text: 'Acheter un billet',
        onPress: () => Linking.openURL(event.ticket_url!),
      });
    }

    if (!event.is_registered) {
      buttons.unshift({
        text: "M'inscrire",
        onPress: async () => {
          try {
            await registerForEvent(user!.id, event.id);
            setEvents((current) =>
              current.map((e) => (e.id === event.id ? { ...e, is_registered: true } : e)),
            );
            Alert.alert('Inscrit !', 'Vous êtes inscrit à cet événement.');
          } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err));
          }
        },
      });
    }

    Alert.alert(event.title, message, buttons);
  };

  const handleGroupToggle = async (group: CommunityGroup) => {
    try {
      if (group.is_member) {
        await leaveGroup(user.id, group.id);
        Alert.alert('Groupe quitté', `Vous avez quitté "${group.name}".`);
      } else {
        await joinGroup(user.id, group.id);
        Alert.alert('Bienvenue !', `Vous avez rejoint "${group.name}".`);
      }
      loadData();
    } catch (err) {
      Alert.alert('Erreur', getErrorMessage(err));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Communauté" subtitle="Événements & groupes fans" />
      <MigrationBanner />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Prochains événements</Text>
          {events.length === 0 ? (
            <Text style={styles.empty}>Aucun événement pour le moment.</Text>
          ) : (
            events.map((event) => (
              <Pressable key={event.id} style={styles.eventCard} onPress={() => handleEventPress(event)}>
                <View style={styles.eventIcon}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                  <Text style={styles.eventDate}>{formatEventDate(event.event_date)}</Text>
                  {event.is_registered ? (
                    <Text style={styles.registered}>✓ Inscrit</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            ))
          )}

          <Text style={styles.sectionTitle}>Groupes</Text>
          {groups.length === 0 ? (
            <Text style={styles.empty}>
              Aucun groupe disponible. Exécutez setup-complete.sql dans Supabase.
            </Text>
          ) : (
            groups.map((group) => (
              <Pressable
                key={group.id}
                style={styles.groupCard}
                onPress={() =>
                  router.push({ pathname: '/group/[id]', params: { id: group.id } })
                }
              >
                <View style={styles.groupAvatar}>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMembers}>
                    {group.member_count.toLocaleString('fr-FR')} membres
                  </Text>
                </View>
                <Pressable
                  style={[styles.joinButton, group.is_member && styles.joinButtonActive]}
                  onPress={() => handleGroupToggle(group)}
                >
                  <Text style={styles.joinText}>
                    {group.is_member ? 'Membre ✓' : 'Rejoindre'}
                  </Text>
                </Pressable>
              </Pressable>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  loader: { marginTop: spacing.lg },
  errorBanner: {
    backgroundColor: colors.error + '22',
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: { color: colors.textMuted, marginHorizontal: spacing.md, fontSize: 13 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1, marginLeft: spacing.md },
  eventTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  eventLocation: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  eventDate: { color: colors.primary, fontSize: 12, marginTop: 4, fontWeight: '500' },
  registered: { color: colors.success, fontSize: 12, marginTop: 4, fontWeight: '600' },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: { flex: 1, marginLeft: spacing.md },
  groupName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  groupMembers: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  joinButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinButtonActive: { backgroundColor: colors.primary + '22' },
  joinText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});