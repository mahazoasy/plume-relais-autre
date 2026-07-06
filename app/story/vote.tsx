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
import { notificationsService } from '../../src/services/supabase/notifications';
import { supabase } from '../../src/config/supabase';
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
    // S'abonner aux changements de votes en temps réel
    const subscription = votesService.subscribeToVotes(id as string, (payload) => {
      // Rafraîchir les données quand un vote est ajouté ou modifié
      fetchData();
    });
    return () => {
      subscription.unsubscribe();
    };
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

  // Fonction pour clôturer le tour après le vote
  const closeTurn = async () => {
    if (!story) return;

    try {
      // 1. Trouver la contribution gagnante (celle avec le plus de votes)
      const winner = await votesService.getWinningContribution(story.id, story.current_turn);
      
      if (!winner) {
        console.log('Aucune contribution gagnante trouvée');
        return;
      }

      // 2. Marquer comme canon
      await contributionsService.markAsCanon(winner.id);

      // 3. Passer au tour suivant
      const newTurn = story.current_turn + 1;
      await storiesService.updateTurn(story.id, newTurn);

      // 4. Si le tour max est atteint, marquer comme terminée
      if (newTurn > story.max_contributions) {
        await storiesService.updateStoryStatus(story.id, 'completed');
        
        // Notifier tous les participants que l'histoire est terminée
        const { data: participants } = await supabase
          .from('story_participations')
          .select('user_id')
          .eq('story_id', story.id);

        for (const p of participants || []) {
          await notificationsService.createNotification({
            user_id: p.user_id,
            type: 'story_completed',
            title: '🎉 Histoire terminée !',
            message: `"${story.title}" est maintenant terminée. Bravo à tous !`,
            story_id: story.id,
          });
        }
      }

      Alert.alert('Succès', 'Tour clôturé ! La contribution gagnante a été sélectionnée.');
    } catch (error: any) {
      console.error('Erreur lors de la clôture du tour:', error);
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

    // Vérifier que l'utilisateur ne vote pas pour sa propre proposition
    const selectedContribution = contributions.find(c => c.id === contributionId);
    if (selectedContribution?.author_id === user.id) {
      Alert.alert('Erreur', 'Vous ne pouvez pas voter pour votre propre proposition');
      return;
    }

    setVoting(true);
    try {
      // 1. Enregistrer le vote
      await votesService.castVote({
        contribution_id: contributionId,
        user_id: user.id,
        story_id: id as string,
        turn_number: story.current_turn,
      });

      // 2. Mettre à jour l'état local
      setUserVote(contributionId);

      // 3. Notification à l'utilisateur
      await notificationsService.createNotification({
        user_id: user.id,
        type: 'vote_open',
        title: 'Vote enregistré',
        message: `Votre vote pour "${story.title}" a bien été pris en compte.`,
        story_id: id as string,
      });

      Alert.alert('Succès', 'Votre vote a été enregistré !');

      // 4. Rafraîchir les données
      await fetchData();

      // 5. Clôturer automatiquement le tour après le vote
      // (on attend un peu pour que les données soient à jour)
      setTimeout(async () => {
        await closeTurn();
        // Rediriger vers le détail de l'histoire pour voir la mise à jour
        router.replace(`/story/${id}`);
      }, 500);
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
          {userVote ? 'Vous avez déjà voté' : 'Votez pour la suite de l\'histoire'}
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

        {userVote && (
          <View style={styles.votedInfo}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.votedInfoText}>
              Vous avez voté ! Le tour sera clôturé automatiquement.
            </Text>
          </View>
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
  votedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FFF0',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 40,
    gap: 8,
  },
  votedInfoText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    flex: 1,
  },
});