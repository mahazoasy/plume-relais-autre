import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Utilisateur';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Accueil</Text>
      <Text style={styles.subtitle}>Bienvenue sur Plume Relais, {username} !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});