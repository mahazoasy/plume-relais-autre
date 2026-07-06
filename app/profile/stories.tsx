import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { getStatusLabel, getStatusColor, truncateText } from '../../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

interface Story {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  status: string;
  current_turn: number;
  created_at: string;
}

export default function MyStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchStories();
  }, []);

  const fetchStories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await storiesService.getStories({ userId: user.id });
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStories();
  };

  const renderItem = ({ item }: { item: Story }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/story/${item.id}`)}
        activeOpacity={0.85}
      >
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.coverThumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.coverThumbnail, styles.coverPlaceholder]}>
            <Ionicons name="book-outline" size={26} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {truncateText(item.description, 80)}
            </Text>
          ) : (
            <Text style={styles.cardDescPlaceholder} numberOfLines={2}>Aucune description</Text>
          )}
          <View style={styles.cardFooter}>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.cardStatus, { color: statusColor }]}>{getStatusLabel(item.status)}</Text>
            </View>
            <Text style={styles.cardTurn}>Tour {item.current_turn}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes histoires</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="book-outline" size={28} color={colors.primaryLight} />
              </View>
              <Text style={styles.emptyText}>Vous n'avez créé aucune histoire</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
  },
  headerBtn: { width: 32 },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  coverThumbnail: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    marginRight: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  coverPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, justifyContent: 'space-between' },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  cardDesc: { fontSize: 13.5, color: colors.textSecondary, marginTop: 3 },
  cardDescPlaceholder: { fontSize: 13.5, color: colors.textMuted, fontStyle: 'italic', marginTop: 3 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  cardStatus: { fontSize: 11.5, fontWeight: '700' },
  cardTurn: { fontSize: 11.5, color: colors.textMuted },
  empty: { paddingVertical: 72, alignItems: 'center' },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
});