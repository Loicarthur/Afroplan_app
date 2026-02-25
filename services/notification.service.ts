/**
 * Service pour la gestion des notifications in-app
 */

import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

// Note: On ne peut pas appeler setNotificationHandler sans importer le module.
// On le fera dynamiquement lors de l'initialisation si nécessaire.

export type NotificationType = 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'system';

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
   * Créer une nouvelle notification et déclencher une alerte locale
   */
  async createNotification(notification: {
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    booking_id?: string;
  }) {
    // 1. Sauvegarder en base de données
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
    }

    // Les notifications système (vibrations/push) sont désactivées temporairement
    // mais le message est bien enregistré en base de données.

    return data;
  },

  /**
   * Demander les permissions pour les notifications push
   */
  async registerForPushNotificationsAsync() {
    // Désactivé temporairement
  },

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
    }
  }
};
