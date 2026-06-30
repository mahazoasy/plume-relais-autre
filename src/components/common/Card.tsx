import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const cardStyles = [styles.card, styles[`${variant}Card`], style];
  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, backgroundColor: '#FFFFFF' },
  defaultCard: { backgroundColor: '#FFFFFF' },
  elevatedCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0' },
});