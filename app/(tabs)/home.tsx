import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { getStatusLabel, getStatusColor, truncateText } from '../../src/utils/helpers';

interface Story {
  id: string;
  title: string;
  description?: string;
  status: string;
  current_turn: number;
  created_at: string;
  participants?: { count: number };
}

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

  const [filter, setFilter] = useState({
    sortBy: 'created_at',
    order: 'desc',
    search: '',
  });


  const handleCreateStory = () => {
    router.push('/(tabs)/create');
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}`);
  };

  const FilterBar = () => (
    <View style={styles.filterBar}>
      <TextInput
        style={styles.filterInput}
        placeholder="Rechercher..."
        value={filter.search}
        onChangeText={(text) => setFilter(prev => ({ ...prev, search: text }))}
        onSubmitEditing={fetchStories}
      />
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => {
          // Ouvrir modal de filtres
          setShowFilters(true);
        }}
      >
        <Ionicons name="options-outline" size={20} color="#6C63FF" />
      </TouchableOpacity>
    </View>
  );

  const renderStory = ({ item }: { item: Story }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleStoryPress(item.id)}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {truncateText(item.description, 80)}
        </Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={[styles.cardStatus, { color: getStatusColor(item.status) }]}>
          {getStatusLabel(item.status)}
        </Text>
        <View style={styles.cardRight}>
          <Text style={styles.cardTurn}>Tour {item.current_turn}</Text>
          {item.participants && (
            <Text style={styles.cardParticipants}>👤 {item.participants.count}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Plume Relais</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateStory}>
          <Text style={styles.createBtnText}>+ Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[
          { key: 'my', label: 'Mes histoires' },
          { key: 'open', label: 'À rejoindre' },
          { key: 'completed', label: 'Terminées' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={stories}
        renderItem={renderStory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {activeTab === 'my'
                ? 'Vous ne participez à aucune histoire'
                : activeTab === 'open'
                ? 'Aucune histoire ouverte à rejoindre'
                : 'Aucune histoire terminée'}
            </Text>
            {activeTab === 'my' && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCreateStory}>
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6C63FF' },
  createBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: { color: '#FFF', fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#6C63FF' },
  tabText: { color: '#666', fontSize: 14 },
  tabTextActive: { color: '#FFF', fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  cardRight: { flexDirection: 'row', gap: 12 },
  cardTurn: { fontSize: 12, color: '#999' },
  cardParticipants: { fontSize: 12, color: '#999' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '600' },
});