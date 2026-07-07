import React, { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../src/services/notifications/push';
import { colors } from '../src/theme';

// Configuration du gestionnaire de notifications (doit être en dehors du composant)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Enregistrement des notifications
    registerForPushNotificationsAsync();

    // Écoute des notifications reçues pendant que l'app est au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Écoute quand l'utilisateur interagit avec une notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(' Notification cliquée:', response);
      const storyId = response.notification.request.content.data?.storyId;
      if (storyId) {
        router.push(`/story/${storyId}`);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="story" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="profile/stories" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}