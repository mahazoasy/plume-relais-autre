import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les stats
      const [stories, contributions, votes, comments] = await Promise.all([
        supabase.from('stories').select('*', { count: 'exact' }).eq('created_by', user?.id),
        supabase.from('contributions').select('*', { count: 'exact' }).eq('author_id', user?.id).eq('is_canon', true),
        supabase.from('votes').select('*', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('comments').select('*', { count: 'exact' }).eq('user_id', user?.id),
      ]);

      setStats({
        stories: stories.count || 0,
        contributions: contributions.count || 0,
        votes: votes.count || 0,
        comments: comments.count || 0,
        reputation: user?.user_metadata?.reputation || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Statistiques</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Ionicons name="book" size={32} color="#6C63FF" />
          <Text style={styles.cardValue}>{stats.stories}</Text>
          <Text style={styles.cardLabel}>Histoires</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="create" size={32} color="#FF6B6B" />
          <Text style={styles.cardValue}>{stats.contributions}</Text>
          <Text style={styles.cardLabel}>Contributions</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="thumbs-up" size={32} color="#4CAF50" />
          <Text style={styles.cardValue}>{stats.votes}</Text>
          <Text style={styles.cardLabel}>Votes</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="chatbubbles" size={32} color="#FF9800" />
          <Text style={styles.cardValue}>{stats.comments}</Text>
          <Text style={styles.cardLabel}>Commentaires</Text>
        </View>
        <View style={[styles.card, styles.fullWidth]}>
          <Ionicons name="star" size={32} color="#FFD700" />
          <Text style={styles.cardValue}>{stats.reputation}</Text>
          <Text style={styles.cardLabel}>Réputation</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Styles...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6C63FF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: { width: '100%' },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 8 },
  cardLabel: { fontSize: 12, color: '#999', marginTop: 4 },
});