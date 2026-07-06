import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/hooks/useAuth';
import { colors, spacing, typography } from '../src/theme';

export default function Index() {
  const { user, loading } = useAuth();

  // Attendre que Supabase termine de récupérer la session
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Ionicons name="book" size={36} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.brand}>Plume Relais</Text>
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  // Si connecté, aller vers l'accueil
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Sinon aller vers la page de connexion
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brand: { ...typography.h2, color: colors.textPrimary },
});