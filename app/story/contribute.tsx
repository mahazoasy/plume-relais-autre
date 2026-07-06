import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { contributionsService } from '../../src/services/supabase/contributions';
import { notificationsService } from '../../src/services/supabase/notifications';
import { sendPushNotification } from '../../src/services/notifications/push';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { validateContent } from '../../src/utils/validators';
import { getTimeRemaining, formatTimeRemaining } from '../../src/utils/helpers';
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

export default function Contribute() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    fetchStory();
    const timer = setInterval(() => {
      if (story) {
        const remaining = getTimeRemaining(story.created_at, story.turn_duration);
        setTimeRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [id]);

  const fetchStory = async () => {
    try {
      const data = await storiesService.getStoryById(id as string);
      setStory(data);
      if (data) {
        setTimeRemaining(getTimeRemaining(data.created_at, data.turn_duration));
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const handleSubmit = async () => {
    const validation = validateContent(content);
    if (!validation.valid) {
      Alert.alert('Erreur', validation.error);
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Connectez-vous d\'abord');
      return;
    }

    if (timeRemaining <= 0) {
      Alert.alert('Erreur', 'Le temps pour contribuer est écoulé');
      return;
    }

    setLoading(true);
    try {
      await contributionsService.addContribution({
        story_id: id as string,
        author_id: user.id,
        content: content.trim(),
        turn_number: story.current_turn,
        is_canon: false,
      });

      await notificationsService.createNotification({
        user_id: user.id,
        type: 'contribution_accepted',
        title: 'Votre contribution est en attente',
        message: `Votre proposition pour "${story.title}" sera soumise au vote.`,
        story_id: id as string,
      });

      const { data: participants, error: participantsError } = await supabase
        .from('story_participations')
        .select('user_id, users(push_token)')
        .eq('story_id', id);

      if (!participantsError && participants) {
        const tokens = participants
          .map(p => p.users?.push_token)
          .filter(token => token && typeof token === 'string');

        const otherTokens = tokens.filter((_, index) => participants[index]?.user_id !== user.id);

        for (const token of otherTokens) {
          await sendPushNotification(
            token,
            '📝 Nouvelle contribution',
            `${user.user_metadata?.username || 'Un utilisateur'} a proposé une suite !`,
            { storyId: id }
          ).catch(err => console.warn('Erreur push:', err));
        }
      }

      Alert.alert('Succès', 'Votre contribution a été soumise !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!story) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isTimeExpired = timeRemaining <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contribuer</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.turnInfo}>
            Tour {story.current_turn} / {story.max_contributions}
          </Text>
          <View style={[styles.timerContainer, isTimeExpired && styles.timerContainerExpired]}>
            <Ionicons
              name="alarm-outline"
              size={15}
              color={isTimeExpired ? colors.danger : colors.info}
            />
            <Text style={[styles.timerText, isTimeExpired && styles.timerExpired]}>
              {isTimeExpired ? 'Temps écoulé' : formatTimeRemaining(timeRemaining)}
            </Text>
          </View>
          {story.blind_mode && (
            <View style={styles.blindBadge}>
              <Ionicons name="eye-off-outline" size={13} color={colors.warning} />
              <Text style={styles.blindInfo}>Mode à l'aveugle activé</Text>
            </View>
          )}
        </View>

        <Text style={styles.label}>Écrivez votre suite</Text>
        <Text style={styles.hint}>
          {story.blind_mode
            ? 'Vous ne voyez que les derniers paragraphes'
            : 'Continuez l\'histoire avec votre style'}
        </Text>

        <TextInput
          style={[styles.textArea, isTimeExpired && styles.textAreaDisabled]}
          placeholder={isTimeExpired ? 'Temps écoulé...' : 'Écrivez ici...'}
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          editable={!isTimeExpired && !loading}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isTimeExpired || !content.trim() || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isTimeExpired || !content.trim() || loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnAccent} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isTimeExpired ? 'Temps écoulé' : 'Soumettre'}
            </Text>
          )}
        </TouchableOpacity>
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
  content: { paddingHorizontal: spacing.lg, flex: 1 },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  storyTitle: { ...typography.h3, color: colors.textPrimary },
  turnInfo: { fontSize: 13.5, color: colors.textSecondary, marginTop: 4 },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.infoBg,
    borderRadius: radius.pill,
  },
  timerContainerExpired: { backgroundColor: colors.dangerBg },
  timerText: { fontSize: 13, color: colors.info, fontWeight: '700' },
  timerExpired: { color: colors.danger },
  blindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  blindInfo: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  label: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
  hint: { fontSize: 13.5, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  textArea: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15.5,
    color: colors.textPrimary,
    minHeight: 200,
    lineHeight: 22,
  },
  textAreaDisabled: { backgroundColor: colors.surfaceAlt, opacity: 0.7 },
  submitButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
    ...shadow.button,
  },
  submitButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  submitButtonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '700' },
});