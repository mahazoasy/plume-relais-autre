import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfile() {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Récupérer l'avatar actuel depuis la table users
  useEffect(() => {
    if (user?.id) {
      fetchAvatar();
    }
  }, [user]);

  const fetchAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erreur', 'Permission d\'accès à la galerie refusée');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      // 1. Récupérer le fichier
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user?.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 2. Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 4. Mettre à jour la table users
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // 5. Mettre à jour l'état local
      setAvatarUrl(publicUrl);
      Alert.alert('Succès', 'Avatar mis à jour !');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de télécharger l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return;
    }
    setSaving(true);
    try {
      // Mettre à jour la table users
      const { error } = await supabase
        .from('users')
        .update({ username: username.trim() })
        .eq('id', user?.id);
      if (error) throw error;

      // Mettre à jour les métadonnées de l'utilisateur (pour le contexte)
      const { error: metaError } = await supabase.auth.updateUser({
        data: { username: username.trim() },
      });
      if (metaError) throw metaError;

      Alert.alert('Succès', 'Profil mis à jour');
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  const avatarSource = avatarUrl
    ? { uri: avatarUrl }
    : { uri: `https://ui-avatars.com/api/?name=${username || 'U'}&background=6C63FF&color=fff&size=100` };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickImage}
          disabled={uploading}
        >
          <Image source={avatarSource} style={styles.avatar} />
          {uploading ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color="#FFF" />
            </View>
          ) : (
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          )}
          <Text style={styles.changeAvatarText}>
            {uploading ? 'Téléchargement...' : 'Changer l\'avatar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Votre pseudo"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (saving || uploading) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginLeft: 12 },
  content: { padding: 20, alignItems: 'center' },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  changeAvatarText: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 8,
  },
  inputGroup: { width: '100%', marginTop: 16 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});