import React from 'react';
import { Stack } from 'expo-router';

export default function StoryLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="contribute" options={{ headerShown: false }} />
      <Stack.Screen name="vote" options={{ headerShown: false }} />
    </Stack>
  );
}
