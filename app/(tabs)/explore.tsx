import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Explore() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Explorer</Text>
      <Text style={styles.subtitle}>Découvrez des histoires</Text>
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
