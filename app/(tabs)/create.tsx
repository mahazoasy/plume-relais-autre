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
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

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

      if (coverFile) {
        const coverUrl = await uploadCoverImage(story.id);
        if (coverUrl) {
          await supabase
            .from('stories')
            .update({ cover_image: coverUrl })
            .eq('id', story.id);
        }
      }

      await contributionsService.addContribution({
        story_id: story.id,
        author_id: user.id,
        content: opening.trim(),
        turn_number: 1,
        is_canon: true,
      });

      await storiesService.joinStory(story.id, user.id);

      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une histoire</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>DÉTAILS</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Donnez un titre à votre histoire"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez brièvement l'univers de l'histoire"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Image de couverture</Text>
            <TouchableOpacity style={styles.coverPicker} onPress={pickCoverImage} activeOpacity={0.85}>
              {coverImage ? (
                <>
                  <Image source={{ uri: coverImage }} style={styles.coverPreview} />
                  <View style={styles.coverEditBadge}>
                    <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.coverPlaceholderText}>Choisir une image</Text>
                </>
              )}
            </TouchableOpacity>
            {uploadingCover && <ActivityIndicator size="small" color={colors.primary} style={styles.coverLoading} />}
          </View>

          <Text style={styles.sectionLabel}>PARAGRAPHE D'OUVERTURE</Text>
          <View style={styles.fieldGroup}>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              placeholder="Commencez votre histoire..."
              placeholderTextColor={colors.textMuted}
              value={opening}
              onChangeText={setOpening}
              multiline
              numberOfLines={5}
            />
          </View>

          <Text style={styles.sectionLabel}>PARAMÈTRES</Text>
          <View style={styles.settingsRow}>
            <View style={[styles.fieldGroup, styles.settingsHalf]}>
              <Text style={styles.label}>Contributions max.</Text>
              <TextInput
                style={styles.input}
                value={maxContrib}
                onChangeText={setMaxContrib}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroup, styles.settingsHalf]}>
              <Text style={styles.label}>Durée d'un tour (min)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.visibilityContainer}>
              <TouchableOpacity
                style={[styles.visibilityOption, visibility === 'public' && styles.visibilityActive]}
                onPress={() => setVisibility('public')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="earth-outline"
                  size={16}
                  color={visibility === 'public' ? colors.textOnPrimary : colors.textSecondary}
                />
                <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.visibilityOption, visibility === 'private' && styles.visibilityActive]}
                onPress={() => setVisibility('private')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={visibility === 'private' ? colors.textOnPrimary : colors.textSecondary}
                />
                <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextActive]}>
                  Privé
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={styles.label}>Mode à l'aveugle</Text>
                <Text style={styles.helperText}>
                  {blindMode
                    ? 'Les participants ne verront que les derniers paragraphes'
                    : 'Les participants verront toute l\'histoire'}
                </Text>
              </View>
              <Switch
                value={blindMode}
                onValueChange={setBlindMode}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={blindMode ? colors.primary : '#FFF'}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, (loading || uploadingCover) && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={loading || uploadingCover}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnAccent} />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={18} color={colors.textOnAccent} />
                <Text style={styles.createButtonText}>Créer l'histoire</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.modalTitle}>Histoire créée !</Text>
            <Text style={styles.modalMessage}>
              Votre histoire « {title} » a été publiée avec succès.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal} activeOpacity={0.9}>
              <Text style={styles.modalButtonText}>Voir mes histoires</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
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
  form: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  fieldGroup: { marginBottom: spacing.lg },
  settingsRow: { flexDirection: 'row', gap: spacing.md },
  settingsHalf: { flex: 1 },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  textAreaLarge: { minHeight: 130, textAlignVertical: 'top' },
  visibilityContainer: { flexDirection: 'row', gap: spacing.sm },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visibilityActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  visibilityText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  visibilityTextActive: { color: colors.textOnPrimary },
  switchCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  helperText: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  createButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '700' },
  coverPicker: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  coverPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: { color: colors.textMuted, marginTop: 8, fontSize: 13.5, fontWeight: '600' },
  coverLoading: { marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '82%',
    alignItems: 'center',
    ...shadow.raised,
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
  modalMessage: {
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: radius.pill,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: { color: colors.textOnPrimary, fontSize: 15, fontWeight: '700' },
});