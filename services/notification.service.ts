/**
 * Service pour la gestion des notifications in-app et push locales
 */

import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as Device from 'expo-constants';

// On importe expo-notifications dynamiquement pour éviter les crashs si le module natif manque
const getNotificationsModule = async () => {
  try {
    return await import('expo-notifications');
  } catch (e) {
    console.warn('Expo Notifications module not found');
    return null;
  }
};

export type NotificationType = 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'system' | 'rating_prompt';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  booking_id?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  /**
   * Créer une nouvelle notification (Base de données + Notification Locale)
   */
  async createNotification(notification: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    booking_id?: string;
  }) {
    // 1. Sauvegarder en base de données (Toujours faire ça)
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification in DB:', error);
    }

    // 2. Déclencher une notification locale avec son et vibration
    try {
      const Notifications = await getNotificationsModule();
      if (Notifications) {
        // Configuration du handler au besoin (si pas déjà fait)
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldVibrate: true,
          }),
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.message,
            data: { booking_id: notification.booking_id, type: notification.type },
            sound: true,
            vibrate: [0, 250, 250, 250],
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });
      }
    } catch (e) {
      console.error('Error scheduling local notification:', e);
    }

    return data;
  },

  /**
   * Demander les permissions pour les notifications
   */
  async registerForPushNotificationsAsync() {
    let token;
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        console.error('Erreur récupération token push:', e);
      }
    }

    return token;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  },

  async markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  async deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
  }
};
