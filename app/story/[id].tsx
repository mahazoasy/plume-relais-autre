import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getStatusLabel, getStatusColor, getTimeRemaining, formatTimeRemaining } from '../../src/utils/helpers';

interface Contribution {
  id: string;
  content: string;
  author_id: string;
  author?: { username: string; avatar_url?: string };
  turn_number: number;
  is_canon: boolean;
  created_at: string;
  votes_count?: number;
}

interface Story {
  id: string;
  title: string;
  description?: string;
  status: string;
  current_turn: number;
  blind_mode: boolean;
  turn_duration: number;
  created_at: string;
  max_contributions: number;
  created_by: string;
  created_by_user?: { username: string; avatar_url?: string };
}

export default function StoryDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [pendingContributions, setPendingContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchData();
    setupRealtime();

    // Timer pour le temps restant
    const timer = setInterval(() => {
      if (story) {
        const remaining = getTimeRemaining(story.created_at, story.turn_duration);
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [id]);

  const setupRealtime = () => {
    // S'abonner aux changements de l'histoire
    const storyChannel = supabase
      .channel(`story:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setStory(payload.new as Story);
        }
      )
      .subscribe();

    // S'abonner aux nouvelles contributions
    const contributionsChannel = supabase
      .channel(`contributions:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `story_id=eq.${id}`,
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contributions',
          filter: `story_id=eq.${id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    setSubscription(storyChannel);
  };

  const fetchData = async () => {
    try {
      // Récupérer l'histoire
      const storyData = await supabase
        .from('stories')
        .select(`
          *,
          created_by_user:users!created_by(username, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (storyData.error) throw storyData.error;
      setStory(storyData.data);

      // Récupérer les contributions canoniques
      const canon = await supabase
        .from('contributions')
        .select(`
          *,
          author:users(username, avatar_url),
          votes(count)
        `)
        .eq('story_id', id)
        .eq('is_canon', true)
        .order('turn_number', { ascending: true });

      if (canon.error) throw canon.error;
      setContributions(canon.data || []);

      // Récupérer les contributions en attente du tour actuel
      if (storyData.data) {
        const pending = await supabase
          .from('contributions')
          .select(`
            *,
            author:users(username, avatar_url),
            votes(count)
          `)
          .eq('story_id', id)
          .eq('turn_number', storyData.data.current_turn)
          .eq('is_canon', false);

        if (pending.error) throw pending.error;
        setPendingContributions(pending.data || []);
      }

      // Vérifier si l'utilisateur est participant
      if (user) {
        const participant = await supabase
          .from('story_participations')
          .select('*')
          .eq('story_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsParticipant(!!participant.data);

        // Vérifier si l'utilisateur a déjà voté pour ce tour
        if (storyData.data) {
          const vote = await supabase
            .from('votes')
            .select('*')
            .eq('story_id', id)
            .eq('user_id', user.id)
            .eq('turn_number', storyData.data.current_turn)
            .maybeSingle();

          setHasVoted(!!vote.data);
        }
      }

      if (storyData.data) {
        const remaining = getTimeRemaining(storyData.data.created_at, storyData.data.turn_duration);
        setTimeRemaining(remaining);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleJoin = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Connectez-vous d\'abord');
      return;
    }
    try {
      const { error } = await supabase
        .from('story_participations')
        .insert([{ story_id: id, user_id: user.id }]);

      if (error) throw error;
      setIsParticipant(true);
      Alert.alert('Succès', 'Vous avez rejoint l\'histoire !');
      fetchData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleContribute = () => {
    router.push(`/story/contribute?id=${id}`);
  };

  const handleVote = () => {
    router.push(`/story/vote?id=${id}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Histoire non trouvée</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = story.status === 'completed';
  const canContribute = isParticipant && !isCompleted && timeRemaining > 0;
  const canVote = isParticipant && !isCompleted && pendingContributions.length > 0 && !hasVoted;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {story.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.title}>{story.title}</Text>
          {story.description && (
            <Text style={styles.description}>{story.description}</Text>
          )}
          <View style={styles.infoRow}>
            <Text style={[styles.status, { color: getStatusColor(story.status) }]}>
              {getStatusLabel(story.status)}
            </Text>
            <Text style={styles.turn}>Tour {story.current_turn} / {story.max_contributions}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.meta}>
              👤 {story.created_by_user?.username || 'Anonyme'}
            </Text>
            <Text style={styles.meta}>
              🕐 {formatDate(story.created_at)}
            </Text>
          </View>
          {!isCompleted && (
            <View style={styles.timerContainer}>
              <Text style={[styles.timerLabel, timeRemaining <= 0 && styles.timerExpired]}>
                ⏱️ {timeRemaining <= 0 ? '⏰ Temps écoulé' : formatTimeRemaining(timeRemaining)}
              </Text>
            </View>
          )}
          {story.blind_mode && (
            <View style={styles.blindBadge}>
              <Text style={styles.blindText}>🙈 Mode à l'aveugle</Text>
            </View>
          )}
        </View>

        {!isParticipant && !isCompleted && (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
            <Text style={styles.joinButtonText}>Rejoindre l'histoire</Text>
          </TouchableOpacity>
        )}

        {isParticipant && !isCompleted && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, !canContribute && styles.actionButtonDisabled]}
              onPress={handleContribute}
              disabled={!canContribute}
            >
              <Ionicons name="create-outline" size={24} color={canContribute ? '#6C63FF' : '#999'} />
              <Text style={[styles.actionText, !canContribute && styles.actionTextDisabled]}>
                {timeRemaining <= 0 ? '⏰ Temps écoulé' : 'Contribuer'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, !canVote && styles.actionButtonDisabled]}
              onPress={handleVote}
              disabled={!canVote}
            >
              <Ionicons name="thumbs-up-outline" size={24} color={canVote ? '#6C63FF' : '#999'} />
              <Text style={[styles.actionText, !canVote && styles.actionTextDisabled]}>
                {hasVoted ? '✅ Déjà voté' : pendingContributions.length > 0 ? `Voter (${pendingContributions.length})` : 'Aucun vote'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>📖 Récit</Text>
        {contributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune contribution pour le moment</Text>
          </View>
        ) : (
          contributions.map((contribution, index) => (
            <View key={contribution.id} style={styles.contributionCard}>
              <View style={styles.contributionHeader}>
                <Text style={styles.contributionAuthor}>
                  {contribution.author?.username || 'Anonyme'}
                </Text>
                <Text style={styles.contributionTurn}>Tour {contribution.turn_number}</Text>
              </View>
              <Text style={styles.contributionText}>{contribution.content}</Text>
              <View style={styles.contributionFooter}>
                <Text style={styles.contributionDate}>{formatDate(contribution.created_at)}</Text>
                {contribution.votes_count !== undefined && (
                  <Text style={styles.voteCount}>👍 {contribution.votes_count}</Text>
                )}
              </View>
            </View>
          ))
        )}

        {pendingContributions.length > 0 && !isCompleted && (
          <>
            <Text style={styles.sectionTitle}>📝 Propositions en attente</Text>
            {pendingContributions.map((contribution) => (
              <View key={contribution.id} style={[styles.contributionCard, styles.pendingCard]}>
                <View style={styles.contributionHeader}>
                  <Text style={styles.contributionAuthor}>
                    {contribution.author?.username || 'Anonyme'}
                  </Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>En attente</Text>
                  </View>
                </View>
                <Text style={styles.contributionText}>{contribution.content}</Text>
                <View style={styles.contributionFooter}>
                  <Text style={styles.contributionDate}>{formatDate(contribution.created_at)}</Text>
                  <Text style={styles.voteCount}>👍 {contribution.votes_count || 0}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#666' },
  backLink: { color: '#6C63FF', marginTop: 12, fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginLeft: 12 },
  content: { padding: 16 },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  description: { fontSize: 14, color: '#666', marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  status: { fontSize: 14, fontWeight: '600' },
  turn: { fontSize: 14, color: '#6C63FF' },
  meta: { fontSize: 12, color: '#999' },
  timerContainer: { marginTop: 8, padding: 8, backgroundColor: '#F0F0FF', borderRadius: 8 },
  timerLabel: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  timerExpired: { color: '#FF3B30' },
  blindBadge: {
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  blindText: { fontSize: 12, color: '#FF9800', fontWeight: '600' },
  joinButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actionContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C63FF',
    gap: 8,
  },
  actionButtonDisabled: { borderColor: '#E0E0E0', opacity: 0.6 },
  actionText: { color: '#6C63FF', fontWeight: '600' },
  actionTextDisabled: { color: '#999' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 12 },
  contributionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  pendingCard: { borderLeftColor: '#FFB800' },
  contributionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  contributionAuthor: { fontSize: 14, fontWeight: '600', color: '#6C63FF' },
  contributionTurn: { fontSize: 12, color: '#999' },
  contributionText: { fontSize: 16, color: '#333' },
  contributionFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  contributionDate: { fontSize: 12, color: '#999' },
  voteCount: { fontSize: 12, color: '#6C63FF' },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadgeText: { fontSize: 10, color: '#FF9800', fontWeight: '600' },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#999' },
});