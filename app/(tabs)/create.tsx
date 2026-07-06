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
  Image,
  Modal, 
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { storiesService } from '../../src/services/supabase/stories';
import { contributionsService } from '../../src/services/supabase/contributions';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import {
  validateTitle,
  validateContent,
  validateNumber,
} from '../../src/utils/validators';

export default function Create() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opening, setOpening] = useState('');
  const [maxContrib, setMaxContrib] = useState('10');
  const [duration, setDuration] = useState('5');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [blindMode, setBlindMode] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<any>(null);
  // État pour le Modal de succès
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erreur', 'Permission d\'accès à la galerie refusée');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setCoverImage(asset.uri);
      setCoverFile(asset);
    }
  };

  const uploadCoverImage = async (storyId: string): Promise<string | null> => {
    if (!coverFile) return null;

    setUploadingCover(true);
    try {
      const fileExt = coverFile.mimeType?.split('/')[1] || 'jpg';
      const fileName = `${storyId}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const response = await fetch(coverFile.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image de couverture : ' + error.message);
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

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

      // 2. Uploader l'image de couverture
      if (coverFile) {
        const coverUrl = await uploadCoverImage(story.id);
        if (coverUrl) {
          await supabase
            .from('stories')
            .update({ cover_image: coverUrl })
            .eq('id', story.id);
        }
      }

      // 3. Ajouter la contribution d'ouverture (canon)
      await contributionsService.addContribution({
        story_id: story.id,
        author_id: user.id,
        content: opening.trim(),
        turn_number: 1,
        is_canon: true,
      });

      // 4. Ajouter le créateur comme participant
      await storiesService.joinStory(story.id, user.id);

      // Afficher le Modal personnalisé au lieu d'Alert.alert
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Rediriger vers l'accueil après fermeture du Modal
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
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

          {/* Section image de couverture */}
          <Text style={styles.label}>Image de couverture</Text>
          <TouchableOpacity style={styles.coverPicker} onPress={pickCoverImage}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverPreview} />
            ) : (
              <>
                <Ionicons name="image-outline" size={40} color="#999" />
                <Text style={styles.coverPlaceholderText}>Choisir une image</Text>
              </>
            )}
          </TouchableOpacity>
          {uploadingCover && <ActivityIndicator size="small" color="#6C63FF" style={styles.coverLoading} />}

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
          <TextInput style={styles.input} value={maxContrib} onChangeText={setMaxContrib} keyboardType="numeric" />

          <Text style={styles.label}>Durée d'un tour (minutes)</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />

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
            style={[styles.createButton, (loading || uploadingCover) && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading || uploadingCover}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createButtonText}>Créer l'histoire</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL PERSONNALISÉ DE SUCCÈS */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.modalTitle}>Succès</Text>
            <Text style={styles.modalMessage}>
              Votre histoire "{title}" a été créée avec succès !
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal}>
              <Text style={styles.modalButtonText}>Voir mes histoires</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  visibilityActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  visibilityText: {
    color: '#666',
  },
  visibilityTextActive: {
    color: '#FFF',
  },
  switchContainer: {
    marginTop: 16,
  },
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
  switchLabel: {
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coverPicker: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 8,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholderText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  coverLoading: {
    marginTop: 8,
  },
  // Styles du Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});