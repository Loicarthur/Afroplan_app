import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/booking.service';
import { notificationService } from '@/services/notification.service';
import { salonService } from '@/services/salon.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook pour gérer les rappels de rendez-vous (1h, 30min, 20min, 10min avant)
 * Déclenche des notifications locales avec son et vibration
 */
export function useBookingReminders() {
  const { user, isAuthenticated, isCoiffeur, isClient } = useAuth();
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (checkInterval.current) clearInterval(checkInterval.current);
      return;
    }

    const checkUpcomingBookings = async () => {
      try {
        let bookingsToCheck = [];

        if (isClient) {
          const clientBookings = await bookingService.getClientBookings(user.id, 'confirmed', 1);
          bookingsToCheck.push(...clientBookings.data);
        }

        if (isCoiffeur) {
          const salon = await salonService.getSalonByOwnerId(user.id);
          if (salon) {
            const salonBookings = await bookingService.getSalonBookings(salon.id, 'confirmed', undefined, 1);
            bookingsToCheck.push(...salonBookings.data);
          }
        }
        
        const now = new Date();
        
        for (const booking of bookingsToCheck) {
          const [hours, minutes] = booking.start_time.split(':').map(Number);
          const bookingDate = new Date(booking.booking_date);
          bookingDate.setHours(hours, minutes, 0, 0);

          const diffMs = bookingDate.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);

          // Seuils de rappel : 60, 30, 20, 10 min avant ET 5 min après (seuil -5)
          // Ajout du seuil 20 min comme demandé
          const thresholds = [60, 30, 20, 10, -5];
          
          for (const threshold of thresholds) {
            // Fenêtre de détection de 5 minutes
            if (diffMins <= threshold && diffMins > threshold - 5) {
              const storageKey = `@reminder_${booking.id}_${threshold}_${user.id}`;
              const alreadyNotified = await AsyncStorage.getItem(storageKey);

              if (!alreadyNotified) {
                const isPostBooking = threshold === -5;
                
                if (isPostBooking && isClient) {
                  // Notification post-RDV seulement pour le client
                  await notificationService.createNotification({
                    user_id: user.id,
                    title: 'Donnez votre avis ! ✨',
                    message: `Comment s'est passée votre coiffure chez ${booking.salon?.name || 'votre salon'} ? Laissez une note !`,
                    type: 'rating_prompt',
                    booking_id: booking.id,
                  });
                } else if (!isPostBooking) {
                  // Notification de rappel pour Client ET Coiffeur
                  const isNear = threshold <= 20;
                  await notificationService.createNotification({
                    user_id: user.id,
                    title: isNear ? 'Rendez-vous imminent ! ⏳' : 'Rappel Rendez-vous',
                    message: isCoiffeur 
                      ? `Votre prochain RDV avec ${booking.client?.full_name || 'un client'} commence dans ${threshold} minutes.`
                      : `Votre RDV chez ${booking.salon?.name || 'le salon'} commence dans ${threshold} minutes.`,
                    type: 'booking_reminder',
                    booking_id: booking.id,
                  });
                }
                
                await AsyncStorage.setItem(storageKey, 'true');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Vérifier toutes les minutes pour plus de précision (surtout pour le seuil 20min)
    checkUpcomingBookings();
    checkInterval.current = setInterval(checkUpcomingBookings, 60000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [user?.id, isAuthenticated, isCoiffeur, isClient]);
}
