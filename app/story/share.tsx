import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; 

export default function Share() {
  const { id } = useLocalSearchParams();
  const url = `https://plume-relais.com/story/${id}`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        // Sur web, on utilise l'API de partage du navigateur
        if (navigator.share) {
          await navigator.share({
            title: 'Partager cette histoire',
            text: `Découvrez cette histoire sur Plume Relais : ${url}`,
            url,
          });
        } else {
          // Fallback : copier dans le presse-papiers
          await navigator.clipboard.writeText(url);
          Alert.alert('Lien copié', 'Le lien a été copié dans votre presse-papiers.');
        }
      } else {
        // Sur mobile, on utilise expo-sharing
        await Sharing.shareAsync(url, {
          dialogTitle: 'Partager cette histoire',
          mimeType: 'text/plain',
        });
      }
    } catch (error: any) {
      // Si l'utilisateur annule, l'erreur peut être "AbortError" ou "canceled"
      if (error.message?.includes('canceled') || error.message?.includes('AbortError')) {
        // Ignorer l'annulation
        return;
      }
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partager</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Partagez cette histoire</Text>
        <Text style={styles.subtitle}>Envoyez le lien à vos amis</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={32} color="#FFF" />
          <Text style={styles.shareText}>Partager maintenant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// styles inchangés
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
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, marginBottom: 32 },
  shareButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});