import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/config/supabase';
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

export default function Explore() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stories')
        .select('*')
        .eq('visibility', 'public')
        .in('status', ['open', 'in_progress']);

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
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

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const renderStory = ({ item }: { item: Story }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleStoryPress(item.id)} activeOpacity={0.85}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.coverThumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.coverThumbnail, styles.coverPlaceholder]}>
            <Ionicons name="compass-outline" size={26} color={colors.textMuted} />
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

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PLUME RELAIS</Text>
        <Text style={styles.title}>Explorer</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une histoire..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchStories}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={stories}
        renderItem={renderStory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="search-outline" size={30} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyText}>
              {search ? 'Aucune histoire trouvée' : 'Aucune histoire publique disponible'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm },
  eyebrow: { ...typography.label, color: colors.accentDark, marginBottom: 2 },
  title: { ...typography.h1, color: colors.textPrimary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.textPrimary },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
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
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});