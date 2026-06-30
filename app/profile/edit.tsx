import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

export default function EditProfile() {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return;
    }
    setLoading(true);
    try {
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
      setLoading(false);
    }
  };

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
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${username || 'U'}&background=6C63FF&color=fff&size=100`,
            }}
            style={styles.avatar}
          />
        </View>

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
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
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
  avatarContainer: { marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6C63FF' },
  inputGroup: { width: '100%', marginBottom: 24 },
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
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});