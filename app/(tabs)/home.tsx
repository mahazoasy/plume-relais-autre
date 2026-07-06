import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { Ionicons } from '@expo/vector-icons';
import { getStatusLabel, getStatusColor, truncateText } from '../../src/utils/helpers';
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

interface Story {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  status: string;
  current_turn: number;
  created_at: string;
  participants?: { count: number };
}

const TABS: { key: 'my' | 'open' | 'completed'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'my', label: 'Mes histoires', icon: 'book-outline' },
  { key: 'open', label: 'À rejoindre', icon: 'people-outline' },
  { key: 'completed', label: 'Terminées', icon: 'checkmark-done-outline' },
];

export default function Home() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'open' | 'completed'>('my');

  useEffect(() => {
    fetchStories();
  }, [activeTab]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      let filters: any = {};
      if (activeTab === 'my' && user) {
        filters.userId = user.id;
      } else if (activeTab === 'open') {
        filters.status = 'open';
        filters.visibility = 'public';
      } else if (activeTab === 'completed') {
        filters.status = 'completed';
      }
      const data = await storiesService.getStories(filters);
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

  const handleCreateStory = () => {
    router.push('/(tabs)/create');
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
            <View style={styles.cardRight}>
              <Ionicons name="repeat-outline" size={13} color={colors.textMuted} />
              <Text style={styles.cardTurn}>Tour {item.current_turn}</Text>
              {item.participants && (
                <>
                  <Ionicons name="person-outline" size={13} color={colors.textMuted} style={{ marginLeft: 8 }} />
                  <Text style={styles.cardParticipants}>{item.participants.count}</Text>
                </>
              )}
            </View>
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
        <View>
          <Text style={styles.eyebrow}>PLUME RELAIS</Text>
          <Text style={styles.title}>Vos histoires</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateStory} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={colors.textOnAccent} />
          <Text style={styles.createBtnText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.85}
            >
              <Ionicons name={tab.icon} size={15} color={active ? colors.textOnPrimary : colors.textSecondary} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
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
              <Ionicons name="book-outline" size={30} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyText}>
              {activeTab === 'my'
                ? 'Vous ne participez à aucune histoire'
                : activeTab === 'open'
                ? 'Aucune histoire ouverte à rejoindre'
                : 'Aucune histoire terminée'}
            </Text>
            {activeTab === 'my' && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreateStory} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Créer une histoire</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  eyebrow: { ...typography.label, color: colors.accentDark, marginBottom: 2 },
  title: { ...typography.h1, color: colors.textPrimary },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadow.button,
  },
  createBtnText: { color: colors.textOnAccent, fontWeight: '700', fontSize: 13.5 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  tabTextActive: { color: colors.textOnPrimary },
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
  cardDesc: { ...typography.body, fontSize: 13.5, color: colors.textSecondary, marginTop: 3 },
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
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  cardTurn: { fontSize: 11.5, color: colors.textMuted, marginLeft: 3 },
  cardParticipants: { fontSize: 11.5, color: colors.textMuted, marginLeft: 3 },
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
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13.5 },
});