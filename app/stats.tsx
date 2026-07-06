import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../src/theme';

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const cards = [
    { icon: 'book-outline' as const, value: stats.stories, label: 'Histoires', tint: colors.primary, tintBg: `${colors.primary}14` },
    { icon: 'create-outline' as const, value: stats.contributions, label: 'Contributions', tint: colors.info, tintBg: colors.infoBg },
    { icon: 'thumbs-up-outline' as const, value: stats.votes, label: 'Votes', tint: colors.success, tintBg: colors.successBg },
    { icon: 'chatbubbles-outline' as const, value: stats.comments, label: 'Commentaires', tint: colors.warning, tintBg: colors.warningBg },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.reputationCard}>
          <View style={styles.reputationIconWrap}>
            <Ionicons name="star" size={26} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.reputationValue}>{stats.reputation}</Text>
            <Text style={styles.reputationLabel}>Points de réputation</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {cards.map((c) => (
            <View key={c.label} style={styles.card}>
              <View style={[styles.cardIconWrap, { backgroundColor: c.tintBg }]}>
                <Ionicons name={c.icon} size={22} color={c.tint} />
              </View>
              <Text style={styles.cardValue}>{c.value}</Text>
              <Text style={styles.cardLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
  },
  headerBtn: { width: 32 },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  content: { padding: spacing.lg },
  reputationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  reputationIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reputationValue: { fontSize: 26, fontWeight: '700', color: colors.textOnPrimary },
  reputationLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    ...shadow.card,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  cardLabel: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
});