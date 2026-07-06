import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../config/supabase';

// Configuration du handler pour les notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Permission de notification non accordée');
    return;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Sauvegarder le token en base de données pour cet utilisateur
    // (dans la table profiles, ou une table dédiée)
    // Vous pouvez l'ajouter dans la table users ou créer une table push_tokens.
    // Exemple : sauvegarder dans la table users (colonnes push_token)
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user) {
    //   await supabase.from('users').update({ push_token: token }).eq('id', user.id);
    // }
  } catch (error) {
    console.error('Erreur d\'obtention du token:', error);
  }

  return token;
}

// Fonction pour envoyer une notification via Expo Push API
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}