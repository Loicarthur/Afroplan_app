import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/booking.service';
import { notificationService } from '@/services/notification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook pour gérer les rappels de rendez-vous (1h, 30min, 10min avant)
 * Simule des notifications push en créant des notifications in-app
 */
export function useBookingReminders() {
  const { user, isAuthenticated } = useAuth();
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (checkInterval.current) clearInterval(checkInterval.current);
      return;
    }

    const checkUpcomingBookings = async () => {
      try {
        const { clientService } = await import('@/services/client.service');
        const clientBookings = await clientService.getBookingHistory(user.id, 1);
        
        const now = new Date();
        
        for (const booking of clientBookings.data) {
          if (booking.status !== 'confirmed') continue;

          const [hours, minutes] = booking.start_time.split(':').map(Number);
          const bookingDate = new Date(booking.booking_date);
          bookingDate.setHours(hours, minutes, 0, 0);

          const diffMs = bookingDate.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);

          // Seuils de rappel : 60 min, 30 min, 10 min
          const thresholds = [60, 30, 10];
          
          for (const threshold of thresholds) {
            // Si on est dans la fenêtre du seuil (ex: entre 55 et 60 min avant)
            if (diffMins <= threshold && diffMins > threshold - 5) {
              const storageKey = `@reminder_${booking.id}_${threshold}`;
              const alreadyNotified = await AsyncStorage.getItem(storageKey);

              if (!alreadyNotified) {
                await notificationService.createNotification({
                  user_id: user.id,
                  title: 'Rendez-vous proche !',
                  message: `Votre RDV chez ${booking.salon?.name || 'le salon'} commence dans ${threshold} minutes.`,
                  type: 'booking_reminder',
                  booking_id: booking.id,
                });
                await AsyncStorage.setItem(storageKey, 'true');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Vérifier toutes les 2 minutes
    checkUpcomingBookings();
    checkInterval.current = setInterval(checkUpcomingBookings, 120000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [user?.id, isAuthenticated]);
}
