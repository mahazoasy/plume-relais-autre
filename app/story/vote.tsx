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
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

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
    const subscription = votesService.subscribeToVotes(id as string, (payload) => {
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

  const closeTurn = async () => {
    if (!story) return;

    try {
      const winner = await votesService.getWinningContribution(story.id, story.current_turn);

      if (!winner) {
        console.log('Aucune contribution gagnante trouvée');
        return;
      }

      await contributionsService.markAsCanon(winner.id);

      const newTurn = story.current_turn + 1;
      await storiesService.updateTurn(story.id, newTurn);

      if (newTurn > story.max_contributions) {
        await storiesService.updateStoryStatus(story.id, 'completed');

        const { data: participants } = await supabase
          .from('story_participations')
          .select('user_id')
          .eq('story_id', story.id);

        for (const p of participants || []) {
          await notificationsService.createNotification({
            user_id: p.user_id,
            type: 'story_completed',
            title: 'Histoire terminée !',
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

    const selectedContribution = contributions.find(c => c.id === contributionId);
    if (selectedContribution?.author_id === user.id) {
      Alert.alert('Erreur', 'Vous ne pouvez pas voter pour votre propre proposition');
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

      await notificationsService.createNotification({
        user_id: user.id,
        type: 'vote_open',
        title: 'Vote enregistré',
        message: `Votre vote pour "${story.title}" a bien été pris en compte.`,
        story_id: id as string,
      });

      Alert.alert('Succès', 'Votre vote a été enregistré !');

      await fetchData();

      setTimeout(async () => {
        await closeTurn();
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voter</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choisissez votre contribution préférée</Text>
        <Text style={styles.subtitle}>
          {userVote ? 'Vous avez déjà voté' : 'Votez pour la suite de l\'histoire'}
        </Text>

        {contributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="hourglass-outline" size={26} color={colors.primaryLight} />
            </View>
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
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.authorRow}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitial}>
                        {(contribution.author?.username || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.author}>
                      {contribution.author?.username || 'Anonyme'}
                    </Text>
                  </View>
                  <View style={styles.voteBadge}>
                    <Ionicons name="thumbs-up" size={13} color={colors.primary} />
                    <Text style={styles.voteCount}>{voteCount}</Text>
                  </View>
                </View>
                <Text style={styles.contentText}>{contribution.content}</Text>
                {isVoted && (
                  <View style={styles.votedTag}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.votedTagText}>Votre vote</Text>
                  </View>
                )}
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
            activeOpacity={0.9}
          >
            {voting ? (
              <ActivityIndicator color={colors.textOnAccent} />
            ) : (
              <Text style={styles.voteButtonText}>Voter pour cette contribution</Text>
            )}
          </TouchableOpacity>
        )}

        {userVote && (
          <View style={styles.votedInfo}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
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
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
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
  content: { paddingHorizontal: spacing.lg },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { fontSize: 13.5, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.card,
  },
  cardSelected: { borderColor: colors.primary },
  cardVoted: { borderColor: colors.success, backgroundColor: colors.successBg },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: { color: '#FFF', fontSize: 11.5, fontWeight: '700' },
  author: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  voteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  voteCount: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  contentText: { fontSize: 15.5, color: colors.textPrimary, lineHeight: 22 },
  votedTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  votedTagText: { fontSize: 12, color: colors.success, fontWeight: '700' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  voteButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxxl,
    ...shadow.button,
  },
  voteButtonDisabled: { opacity: 0.5 },
  voteButtonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '700' },
  votedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    marginBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  votedInfoText: {
    fontSize: 13.5,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
});