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
      // 1. Ajouter la contribution
      await contributionsService.addContribution({
        story_id: id as string,
        author_id: user.id,
        content: content.trim(),
        turn_number: story.current_turn,
        is_canon: false,
      });

      // 2. Créer la notification en base
      await notificationsService.createNotification({
        user_id: user.id,
        type: 'contribution_accepted',
        title: 'Votre contribution est en attente',
        message: `Votre proposition pour "${story.title}" sera soumise au vote.`,
        story_id: id as string,
      });

      // 3. Envoyer une notification push aux participants (y compris l'auteur, mais optionnel)
      // Récupérer les tokens des participants
      const { data: participants, error: participantsError } = await supabase
        .from('story_participations')
        .select('user_id, users(push_token)')
        .eq('story_id', id);

      if (!participantsError && participants) {
        const tokens = participants
          .map(p => p.users?.push_token)
          .filter(token => token && typeof token === 'string');

        // Envoyer à tous les participants (sauf l'auteur lui-même)
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
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const isTimeExpired = timeRemaining <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contribuer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Text style={styles.turnInfo}>
            Tour {story.current_turn} / {story.max_contributions}
          </Text>
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, isTimeExpired && styles.timerExpired]}>
              ⏱️ {isTimeExpired ? '⏰ Temps écoulé' : formatTimeRemaining(timeRemaining)}
            </Text>
          </View>
          {story.blind_mode && (
            <Text style={styles.blindInfo}>🙈 Mode à l'aveugle activé</Text>
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
          placeholder={isTimeExpired ? '⏰ Temps écoulé...' : 'Écrivez ici...'}
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
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isTimeExpired ? '⏰ Temps écoulé' : 'Soumettre'}
            </Text>
          )}
        </TouchableOpacity>
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
  content: { padding: 16, flex: 1 },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  storyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  turnInfo: { fontSize: 14, color: '#666', marginTop: 4 },
  timerContainer: { marginTop: 8, padding: 8, backgroundColor: '#F0F0FF', borderRadius: 8 },
  timerText: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  timerExpired: { color: '#FF3B30' },
  blindInfo: { fontSize: 12, color: '#FF9800', marginTop: 8 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16 },
  hint: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 12 },
  textArea: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    minHeight: 200,
  },
  textAreaDisabled: { backgroundColor: '#F5F5F5', opacity: 0.7 },
  submitButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitButtonDisabled: { backgroundColor: '#CCC' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});