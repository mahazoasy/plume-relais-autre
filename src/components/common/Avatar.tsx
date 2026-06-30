import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  username?: string;
  avatarUrl?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ username, avatarUrl, size = 50 }) => {
  const initial = username ? username.charAt(0).toUpperCase() : '?';

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: { backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#FFF', fontWeight: 'bold' },
});