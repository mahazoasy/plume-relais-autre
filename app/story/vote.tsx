import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { contributionsService } from '../../src/services/supabase/contributions';
import { votesService } from '../../src/services/supabase/votes';
import { Ionicons } from '@expo/vector-icons';

interface Contribution {
  id: string;
  content: string;
  author_id: string;
  author?: { username: string; avatar_url?: string };
  votes_count?: number;
}

export default function Vote() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const storyData = await storiesService.getStoryById(id as string);
      setStory(storyData);

      if (storyData) {
        const pending = await contributionsService.getPendingContributions(
          id as string,
          storyData.current_turn
        );
        setContributions(pending);

        if (user) {
          const vote = await votesService.getUserVoteForTurn(
            id as string,
            user.id,
            storyData.current_turn
          );
          if (vote) {
            setUserVote(vote.contribution_id);
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (contributionId: string) => {
    if (!user) {
      Alert.alert('Erreur', 'Connectez-vous d\'abord');
      return;
    }

    if (userVote) {
      Alert.alert('Info', 'Vous avez déjà voté pour ce tour');
      return;
    }

    setVoting(true);
    try {
      await votesService.castVote({
        contribution_id: contributionId,
        user_id: user.id,
        story_id: id as string,
        turn_number: story.current_turn,
      });

      setUserVote(contributionId);
      Alert.alert('Succès', 'Votre vote a été enregistré !');
      fetchData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setVoting(false);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voter</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>🗳️ Choisissez votre contribution préférée</Text>
        <Text style={styles.subtitle}>
          {userVote ? '✅ Vous avez déjà voté' : 'Votez pour la suite de l\'histoire'}
        </Text>

        {contributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune proposition en attente</Text>
          </View>
        ) : (
          contributions.map((contribution) => {
            const isSelected = selectedId === contribution.id;
            const isVoted = userVote === contribution.id;
            const voteCount = contribution.votes_count || 0;

            return (
              <TouchableOpacity
                key={contribution.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  isVoted && styles.cardVoted,
                ]}
                onPress={() => !userVote && setSelectedId(contribution.id)}
                disabled={!!userVote}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.author}>
                    {contribution.author?.username || 'Anonyme'}
                  </Text>
                  <View style={styles.voteBadge}>
                    <Ionicons name="thumbs-up" size={14} color="#6C63FF" />
                    <Text style={styles.voteCount}>{voteCount}</Text>
                  </View>
                </View>
                <Text style={styles.contentText}>{contribution.content}</Text>
              </TouchableOpacity>
            );
          })
        )}

        {!userVote && contributions.length > 0 && (
          <TouchableOpacity
            style={[
              styles.voteButton,
              (!selectedId || voting) && styles.voteButtonDisabled,
            ]}
            onPress={() => selectedId && handleVote(selectedId)}
            disabled={!selectedId || voting}
          >
            {voting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.voteButtonText}>Voter pour cette contribution</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#6C63FF' },
  cardVoted: { borderColor: '#4CAF50', backgroundColor: '#F0FFF0' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: { fontSize: 14, fontWeight: '600', color: '#6C63FF' },
  voteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voteCount: { fontSize: 12, color: '#6C63FF', fontWeight: '600' },
  contentText: { fontSize: 16, color: '#333' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  voteButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  voteButtonDisabled: { opacity: 0.5 },
  voteButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});