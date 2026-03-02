import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: 'client' | 'coiffeur';
  content: string;
  is_read: boolean;
  created_at: string;
}

export const messageService = {
  /**
   * Recuperer les messages d'une reservation
   */
  async getMessages(bookingId: string): Promise<Message[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Envoyer un message
   */
  async sendMessage(bookingId: string, senderId: string, senderType: 'client' | 'coiffeur', content: string) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        sender_type: senderType,
        content: content.trim(),
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(bookingId: string, userId: string) {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('booking_id', bookingId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) console.error('Error marking messages as read:', error);
  },

  /**
   * Ecouter les nouveaux messages en temps reel
   */
  subscribeToMessages(bookingId: string, callback: (message: Message) => void) {
    if (!isSupabaseConfigured()) return { unsubscribe: () => {} };
    return supabase
      .channel(`booking_messages_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }
};
