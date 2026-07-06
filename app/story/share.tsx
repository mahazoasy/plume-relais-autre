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
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

export default function Share() {
  const { id } = useLocalSearchParams();
  const url = `https://plume-relais.com/story/${id}`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Partager cette histoire',
            text: `Découvrez cette histoire sur Plume Relais : ${url}`,
            url,
          });
        } else {
          await Clipboard.setStringAsync(url);
          Alert.alert('Lien copié', 'Le lien a été copié dans votre presse-papiers.');
        }
      } else {
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

  const handleCopy = async () => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Lien copié', 'Le lien a été copié dans votre presse-papiers.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partager</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="share-social" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Partagez cette histoire</Text>
        <Text style={styles.subtitle}>Envoyez le lien à vos amis</Text>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.9}>
          <Ionicons name="share-social" size={20} color={colors.textOnAccent} />
          <Text style={styles.shareText}>Partager maintenant</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
          <Text style={styles.copyText}>Copier le lien</Text>
        </TouchableOpacity>

        <View style={styles.linkCard}>
          <Ionicons name="link-outline" size={14} color={colors.textMuted} />
          <Text style={styles.linkDisplay} numberOfLines={1}>{url}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { fontSize: 14.5, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl },
  shareButton: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
    ...shadow.button,
  },
  shareText: { color: colors.textOnAccent, fontSize: 15.5, fontWeight: '700' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.md,
  },
  copyText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  linkDisplay: { fontSize: 12.5, color: colors.textMuted, flexShrink: 1 },
});