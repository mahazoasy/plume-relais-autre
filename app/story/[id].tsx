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
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { contributionsService } from '../../src/services/supabase/contributions';
import { votesService } from '../../src/services/supabase/votes';
import { notificationsService } from '../../src/services/supabase/notifications';
import { Ionicons } from '@expo/vector-icons';
import {
  formatDate,
  getStatusLabel,
  getStatusColor,
  getTimeRemaining,
  formatTimeRemaining,
} from '../../src/utils/helpers';
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

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
  cover_image?: string;
  status: string;
  current_turn: number;
  blind_mode: boolean;
  turn_duration: number;
  created_at: string;
  created_by: string;
  created_by_user?: { username: string; avatar_url?: string };
  max_contributions: number;
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

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      if (story) {
        const remaining = getTimeRemaining(story.created_at, story.turn_duration);
        setTimeRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [id]);

  const fetchData = async () => {
    try {
      const storyData = await storiesService.getStoryById(id as string);
      setStory(storyData);

      const canon = await contributionsService.getCanonContributions(id as string);
      setContributions(canon);

      if (storyData?.current_turn) {
        const pending = await contributionsService.getPendingContributions(
          id as string,
          storyData.current_turn
        );
        setPendingContributions(pending);
      }

      if (user) {
        const participant = await storiesService.checkParticipation(id as string, user.id);
        setIsParticipant(participant);

        const vote = await votesService.getUserVoteForTurn(
          id as string,
          user.id,
          storyData?.current_turn || 1
        );
        setHasVoted(!!vote);
      }

      if (storyData) {
        const remaining = getTimeRemaining(storyData.created_at, storyData.turn_duration);
        setTimeRemaining(remaining);
      }
    } catch (error: any) {
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
      await storiesService.joinStory(id as string, user.id);
      setIsParticipant(true);

      await notificationsService.createNotification({
        user_id: user.id,
        type: 'vote_open',
        title: 'Vous avez rejoint une histoire !',
        message: `Vous participez maintenant à "${story?.title}"`,
        story_id: id as string,
      });

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

  const handleComments = () => {
    router.push(`/story/comments?id=${id}`);
  };

  const handleShare = () => {
    router.push(`/story/share?id=${id}`);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Histoire non trouvée</Text>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backLink}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = story.status === 'completed';
  const canContribute = isParticipant && !isCompleted && timeRemaining > 0;
  const canVote = isParticipant && !isCompleted && pendingContributions.length > 0 && !hasVoted;
  const statusColor = getStatusColor(story.status);
  const progress = Math.min(story.current_turn / story.max_contributions, 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover with overlaid nav */}
      <View style={styles.heroWrap}>
        {story.cover_image ? (
          <Image source={{ uri: story.cover_image }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Ionicons name="book-outline" size={44} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <View style={styles.heroOverlay} />
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={handleGoBack} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
            <Ionicons name="share-social-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroTextWrap}>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusPillText}>{getStatusLabel(story.status)}</Text>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>{story.title}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          {story.description ? (
            <Text style={styles.description}>{story.description}</Text>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={15} color={colors.textMuted} />
            <Text style={styles.meta}>{story.created_by_user?.username || 'Anonyme'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>{formatDate(story.created_at)}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              Tour {story.current_turn} / {story.max_contributions}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <View style={styles.badgeRow}>
            {!isCompleted && (
              <View style={styles.timerBadge}>
                <Ionicons name="alarm-outline" size={14} color={colors.info} />
                <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
              </View>
            )}
            {story.blind_mode && (
              <View style={styles.blindBadge}>
                <Ionicons name="eye-off-outline" size={13} color={colors.warning} />
                <Text style={styles.blindText}>Mode à l'aveugle</Text>
              </View>
            )}
          </View>
        </View>

        {!isParticipant && !isCompleted && (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoin} activeOpacity={0.9}>
            <Ionicons name="add-circle-outline" size={18} color={colors.textOnAccent} />
            <Text style={styles.joinButtonText}>Rejoindre l'histoire</Text>
          </TouchableOpacity>
        )}

        {isParticipant && !isCompleted && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, !canContribute && styles.actionButtonDisabled]}
              onPress={handleContribute}
              disabled={!canContribute}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={20} color={canContribute ? colors.primary : colors.textMuted} />
              <Text style={[styles.actionText, !canContribute && styles.actionTextDisabled]}>
                {timeRemaining <= 0 ? 'Temps écoulé' : 'Contribuer'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, !canVote && styles.actionButtonDisabled]}
              onPress={handleVote}
              disabled={!canVote}
              activeOpacity={0.85}
            >
              <Ionicons name="thumbs-up-outline" size={20} color={canVote ? colors.primary : colors.textMuted} />
              <Text style={[styles.actionText, !canVote && styles.actionTextDisabled]}>
                {hasVoted ? 'Déjà voté' : pendingContributions.length > 0 ? `Voter (${pendingContributions.length})` : 'Aucun vote'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isCompleted && (
          <TouchableOpacity style={styles.commentButton} onPress={handleComments} activeOpacity={0.9}>
            <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
            <Text style={styles.commentButtonText}>Commentaires</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="reader-outline" size={17} color={colors.textPrimary} />
          <Text style={styles.sectionTitle}>Récit</Text>
        </View>

        {contributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune contribution pour le moment</Text>
          </View>
        ) : (
          contributions.map((contribution) => (
            <View key={contribution.id} style={styles.contributionCard}>
              <View style={styles.contributionHeader}>
                <View style={styles.authorRow}>
                  {contribution.author?.avatar_url ? (
                    <Image source={{ uri: contribution.author.avatar_url }} style={styles.authorAvatarImage} />
                  ) : (
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitial}>
                        {(contribution.author?.username || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.contributionAuthor}>
                    {contribution.author?.username || 'Anonyme'}
                  </Text>
                </View>
                <Text style={styles.contributionTurn}>Tour {contribution.turn_number}</Text>
              </View>
              <Text style={styles.contributionText}>{contribution.content}</Text>
              <View style={styles.contributionFooter}>
                <Text style={styles.contributionDate}>{formatDate(contribution.created_at)}</Text>
                {contribution.votes_count !== undefined && (
                  <View style={styles.voteCountWrap}>
                    <Ionicons name="thumbs-up" size={12} color={colors.primary} />
                    <Text style={styles.voteCount}>{contribution.votes_count}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        {pendingContributions.length > 0 && !isCompleted && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="hourglass-outline" size={17} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Propositions en attente</Text>
            </View>
            {pendingContributions.map((contribution) => (
              <View key={contribution.id} style={[styles.contributionCard, styles.pendingCard]}>
                <View style={styles.contributionHeader}>
                  <View style={styles.authorRow}>
                    {contribution.author?.avatar_url ? (
                      <Image source={{ uri: contribution.author.avatar_url }} style={styles.authorAvatarImage} />
                    ) : (
                      <View style={[styles.authorAvatar, styles.authorAvatarPending]}>
                        <Text style={styles.authorInitial}>
                          {(contribution.author?.username || 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.contributionAuthor}>
                      {contribution.author?.username || 'Anonyme'}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>En attente</Text>
                  </View>
                </View>
                <Text style={styles.contributionText}>{contribution.content}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { fontSize: 16, color: colors.textSecondary },
  backLink: { color: colors.primary, marginTop: spacing.md, fontSize: 15, fontWeight: '600' },

  heroWrap: { height: 260, backgroundColor: colors.primary },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(20,16,30,0.35)',
  },
  heroNav: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextWrap: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  statusPillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  heroTitle: { fontSize: 23, fontWeight: '700', color: '#FFF' },

  content: { padding: spacing.lg, marginTop: -radius.xl, backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  description: { fontSize: 14.5, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: spacing.md },
  meta: { fontSize: 12.5, color: colors.textMuted },
  metaDot: { color: colors.textMuted, marginHorizontal: 2 },
  progressRow: { marginBottom: 6 },
  progressLabel: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.infoBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  timerText: { fontSize: 12.5, color: colors.info, fontWeight: '700' },
  blindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  blindText: { fontSize: 12, color: colors.warning, fontWeight: '700' },

  joinButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.button,
  },
  joinButtonText: { color: colors.textOnAccent, fontSize: 15.5, fontWeight: '700' },

  actionContainer: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 7,
  },
  actionButtonDisabled: { borderColor: colors.border },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 13.5 },
  actionTextDisabled: { color: colors.textMuted },

  commentButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  commentButtonText: { color: '#FFF', fontSize: 15.5, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },

  contributionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadow.card,
  },
  pendingCard: { borderLeftColor: colors.warning },
  contributionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarPending: { backgroundColor: colors.warning },
  authorAvatarImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  authorInitial: { color: '#FFF', fontSize: 11.5, fontWeight: '700' },
  contributionAuthor: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  contributionTurn: { fontSize: 11.5, color: colors.textMuted },
  contributionText: { fontSize: 15.5, color: colors.textPrimary, lineHeight: 22 },
  contributionFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  contributionDate: { fontSize: 11.5, color: colors.textMuted },
  voteCountWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  voteCount: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  pendingBadge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pendingBadgeText: { fontSize: 10.5, color: colors.warning, fontWeight: '700' },
  emptyContainer: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted },
});