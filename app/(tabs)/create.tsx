import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { contributionsService } from '../../src/services/supabase/contributions';
import { Ionicons } from '@expo/vector-icons';
import {
  validateTitle,
  validateContent,
  validateNumber,
} from '../../src/utils/validators';
import { STORY_VISIBILITY } from '../../src/utils/constants';

export default function Create() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opening, setOpening] = useState('');
  const [maxContrib, setMaxContrib] = useState('10');
  const [duration, setDuration] = useState('5');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [blindMode, setBlindMode] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    // Validations
    const titleCheck = validateTitle(title);
    if (!titleCheck.valid) {
      Alert.alert('Erreur', titleCheck.error);
      return;
    }

    const openingCheck = validateContent(opening);
    if (!openingCheck.valid) {
      Alert.alert('Erreur', 'Paragraphe d\'ouverture : ' + openingCheck.error);
      return;
    }

    const maxCheck = validateNumber(maxContrib, 2, 50);
    if (!maxCheck.valid) {
      Alert.alert('Erreur', maxCheck.error);
      return;
    }

    const durCheck = validateNumber(duration, 1, 60);
    if (!durCheck.valid) {
      Alert.alert('Erreur', durCheck.error);
      return;
    }

    setLoading(true);
    try {
      // 1. Créer l'histoire
      const storyData = {
        title: title.trim(),
        description: description.trim(),
        created_by: user.id,
        status: 'open',
        max_contributions: parseInt(maxContrib),
        current_turn: 1,
        visibility,
        turn_duration: parseInt(duration),
        blind_mode: blindMode,
      };
      const story = await storiesService.createStory(storyData);

      // 2. Ajouter la contribution d'ouverture (canon)
      await contributionsService.addContribution({
        story_id: story.id,
        author_id: user.id,
        content: opening.trim(),
        turn_number: 1,
        is_canon: true,
      });

      // 3. Ajouter le créateur comme participant
      await storiesService.joinStory(story.id, user.id);

      Alert.alert('Succès', 'Histoire créée avec succès !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer une histoire</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput style={styles.input} placeholder="Donnez un titre" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez brièvement"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Paragraphe d'ouverture *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Commencez votre histoire..."
          value={opening}
          onChangeText={setOpening}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Nombre max de contributions</Text>
        <TextInput
          style={styles.input}
          value={maxContrib}
          onChangeText={setMaxContrib}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Durée d'un tour (minutes)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Visibilité</Text>
        <View style={styles.visibilityContainer}>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === 'public' && styles.visibilityActive]}
            onPress={() => setVisibility('public')}
          >
            <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>
              🌍 Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === 'private' && styles.visibilityActive]}
            onPress={() => setVisibility('private')}
          >
            <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextActive]}>
              🔒 Privé
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Mode à l'aveugle</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{blindMode ? 'Activé' : 'Désactivé'}</Text>
            <Switch
              value={blindMode}
              onValueChange={setBlindMode}
              trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
              thumbColor="#FFF"
            />
          </View>
          <Text style={styles.helperText}>
            {blindMode
              ? 'Les participants ne verront que les derniers paragraphes'
              : 'Les participants verront toute l\'histoire'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createButtonText}>Créer l'histoire</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
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
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  visibilityContainer: { flexDirection: 'row', gap: 12 },
  visibilityOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  visibilityActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  visibilityText: { color: '#666' },
  visibilityTextActive: { color: '#FFF' },
  switchContainer: { marginTop: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchLabel: { color: '#666' },
  helperText: { fontSize: 12, color: '#999', marginTop: 8 },
  createButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});