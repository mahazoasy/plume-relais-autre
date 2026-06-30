import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Share as RNShare,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export default function Share() {
  const { id } = useLocalSearchParams();
  const url = `https://plume-relais.com/story/${id}`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        // API Web Share
        if (navigator.share) {
          await navigator.share({
            title: 'Partager cette histoire',
            text: `Découvrez cette histoire sur Plume Relais : ${url}`,
            url,
          });
        } else {
          // Copie du lien dans le presse-papiers
          await Clipboard.setStringAsync(url);
          Alert.alert('✅ Lien copié', 'Le lien a été copié dans votre presse-papiers.');
        }
      } else {
        // Sur mobile : utilise l'API Share de React Native
        await RNShare.share({
          message: `📖 Découvrez cette histoire sur Plume Relais : ${url}`,
          title: 'Partager l\'histoire',
        });
      }
    } catch (error: any) {
      if (error.message?.includes('canceled') || error.message?.includes('AbortError')) {
        return;
      }
      Alert.alert('Erreur', 'Impossible de partager. Veuillez réessayer.');
      console.warn('Share error:', error);
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
        <Ionicons name="share-social" size={64} color="#6C63FF" />
        <Text style={styles.title}>Partagez cette histoire</Text>
        <Text style={styles.subtitle}>Envoyez le lien à vos amis</Text>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color="#FFF" />
          <Text style={styles.shareText}>Partager maintenant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={async () => {
            await Clipboard.setStringAsync(url);
            Alert.alert('✅ Lien copié', 'Le lien a été copié dans votre presse-papiers.');
          }}
        >
          <Ionicons name="copy" size={20} color="#6C63FF" />
          <Text style={styles.copyText}>Copier le lien</Text>
        </TouchableOpacity>

        <Text style={styles.linkDisplay}>🔗 {url}</Text>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, marginBottom: 32 },
  shareButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  shareText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  copyText: { color: '#6C63FF', fontSize: 14, fontWeight: '500' },
  linkDisplay: { marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' },
});