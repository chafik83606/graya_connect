import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MigrationBanner } from '../../components/MigrationBanner';
import { ScreenHeader } from '../../components/ScreenHeader';
import { fetchNewsFeed } from '../../lib/api/news';
import { getErrorMessage } from '../../lib/errors';
import { colors, radius, spacing } from '../../lib/theme';
import type { NewsArticle } from '../../lib/types';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function sourceIcon(source: string | null): keyof typeof Ionicons.glyphMap {
  const s = (source ?? '').toLowerCase();
  if (s.includes('youtube')) return 'logo-youtube';
  if (s.includes('instagram')) return 'logo-instagram';
  if (s.includes('spotify')) return 'musical-notes';
  return 'newspaper-outline';
}

function NewsCard({ article }: { article: NewsArticle }) {
  const openLink = () => {
    if (article.url) Linking.openURL(article.url);
  };

  return (
    <Pressable style={styles.card} onPress={openLink} disabled={!article.url}>
      {article.image_url ? (
        <Image source={{ uri: article.image_url }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name={sourceIcon(article.source)} size={32} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardBody}>
        {article.source ? (
          <View style={styles.sourceRow}>
            <Ionicons name={sourceIcon(article.source)} size={14} color={colors.primary} />
            <Text style={styles.source}>{article.source}</Text>
            {article.is_auto ? (
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>Auto</Text>
              </View>
            ) : null}
            <Text style={styles.date}>· {formatDate(article.published_at)}</Text>
          </View>
        ) : (
          <Text style={styles.date}>{formatDate(article.published_at)}</Text>
        )}
        <Text style={styles.title}>{article.title}</Text>
        {article.summary ? <Text style={styles.summary}>{article.summary}</Text> : null}
        {article.url ? (
          <Text style={styles.link}>
            {article.source?.toLowerCase().includes('instagram')
              ? 'Voir sur Instagram →'
              : article.source?.toLowerCase().includes('youtube')
                ? 'Regarder sur YouTube →'
                : 'Lire / Voir →'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function NewsScreen() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setError(null);
    setInfo(null);
    try {
      const feed = await fetchNewsFeed();
      setArticles(feed.articles);

      const infos: string[] = [];
      if (feed.manualError && !feed.youtubeError && !feed.instagramError) {
        infos.push('YouTube et Instagram OK. Actualités manuelles indisponibles (exécutez supabase/news.sql).');
      } else if (feed.manualError && feed.articles.length === 0) {
        setError(feed.manualError);
      } else if (feed.manualError) {
        infos.push('Actualités manuelles indisponibles (exécutez supabase/news.sql).');
      }
      if (feed.youtubeError) infos.push('YouTube temporairement indisponible.');
      if (feed.instagramError) infos.push(`Instagram : ${feed.instagramError}`);
      if (feed.instagramHint) infos.push(feed.instagramHint);
      if (infos.length > 0) setInfo(infos.join('\n'));
    } catch (err) {
      setArticles([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNews();
    }, [loadNews]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Actualités" subtitle="YouTube, Instagram & presse Graya" />
      <MigrationBanner />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Exécutez supabase/news.sql dans Supabase.</Text>
        </View>
      ) : null}

      {info ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>{info}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NewsCard article={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucune actualité pour le moment. YouTube et Instagram s'affichent ici automatiquement.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  errorBanner: {
    backgroundColor: colors.error + '22',
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  errorText: { color: colors.error, fontSize: 12, textAlign: 'center' },
  errorHint: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  infoBanner: {
    backgroundColor: colors.primary + '18',
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  infoText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  list: { padding: spacing.md, paddingBottom: 100 },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: 160 },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: spacing.md },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.xs },
  source: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  autoBadge: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  autoBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  date: { color: colors.textMuted, fontSize: 12 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 24 },
  summary: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  link: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: spacing.sm },
});
