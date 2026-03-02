/**
 * Chat Screen - AfroPlan
 * Système de messagerie entre client et coiffeur après réservation
 * Style VTC - Communication activée dès que le RDV est pris
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { bookingService, messageService, Message as DbMessage } from '@/services';
import { BookingWithDetails } from '@/types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isMe: boolean;
  type: 'text' | 'system';
  isAutomatic?: boolean;
}

const mapDbToLocalMessage = (dbMsg: DbMessage, currentUserId: string, salonName: string, clientName: string): Message => {
  const isMe = dbMsg.sender_id === currentUserId;
  const isAutomatic = dbMsg.content.includes('Merci pour votre réservation'); // Heuristic for older messages if needed
  
  return {
    id: dbMsg.id,
    text: dbMsg.content,
    senderId: dbMsg.sender_id,
    senderName: dbMsg.sender_type === 'coiffeur' ? salonName : clientName,
    timestamp: new Date(dbMsg.created_at),
    isMe: isMe,
    type: 'text',
    isAutomatic: isAutomatic
  };
};

// Suggestions de messages rapides selon le rôle
const QUICK_MESSAGES_CLIENT = [
  "Merci beaucoup !",
  "J'aurai un peu de retard",
  "Je suis en route",
  "Pouvez-vous m'envoyer l'adresse ?",
  "Avez-vous des disponibilités ?",
];

const QUICK_MESSAGES_COIFFEUR = [
  "À votre service !",
  "Envoyez-moi vos références",
  "Quel type de tresses souhaitez-vous ?",
  "N'oubliez pas de venir avec les cheveux propres",
  "Je suis disponible si vous avez des questions",
];

function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </View>
    );
  }

  const isMe = message.senderId === currentUserId;
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={[
        styles.messageBubbleContainer,
        isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
      ]}
    >
      {message.isAutomatic && (
        <View style={[styles.automaticTag, isMe && { alignSelf: 'flex-end' }]}>
          <Ionicons name="flash" size={10} color="#7C3AED" />
          <Text style={styles.automaticTagText}>Message automatique</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isMe
            ? styles.messageBubbleMe
            : [styles.messageBubbleOther, { backgroundColor: colors.card }],
          message.isAutomatic && !isMe && styles.messageBubbleAutomatic,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMe
              ? styles.messageTextMe
              : { color: colors.text },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isMe ? styles.messageTimeMe : { color: colors.textMuted },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const loadBookingAndMessages = async () => {
      if (!bookingId || !user) return;
      try {
        // 1. Charger le rôle actif
        const role = await AsyncStorage.getItem('@afroplan_selected_role');
        setActiveRole(role);

        // 2. Charger les données de réservation
        const bookingData = await bookingService.getBookingById(bookingId);
        if (bookingData) {
          setBooking(bookingData);
          
          // 3. Charger les messages réels depuis la DB
          const dbMessages = await messageService.getMessages(bookingId);
          const mappedMessages = dbMessages.map(m => 
            mapDbToLocalMessage(
              m, 
              user.id, 
              bookingData.salon?.name || 'Le Salon', 
              bookingData.client?.full_name || 'Client'
            )
          );
          setMessages(mappedMessages);

          // 4. Marquer comme lus
          messageService.markAsRead(bookingId, user.id);

          // 5. S'abonner aux nouveaux messages
          subscription = messageService.subscribeToMessages(bookingId, (newDbMsg) => {
            // Ignorer si c'est notre propre message (déjà ajouté localement pour la réactivité)
            // Mais en fait, pour la robustesse, on peut juste vérifier si l'ID existe déjà
            setMessages(prev => {
              if (prev.find(m => m.id === newDbMsg.id)) return prev;
              
              const newLocalMsg = mapDbToLocalMessage(
                newDbMsg, 
                user.id, 
                bookingData.salon?.name || 'Le Salon', 
                bookingData.client?.full_name || 'Client'
              );
              
              // Scroll to bottom
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
              
              return [...prev, newLocalMsg];
            });

            // Marquer le nouveau message comme lu s'il n'est pas de nous
            if (newDbMsg.sender_id !== user.id) {
              messageService.markAsRead(bookingId, user.id);
            }
          });
        } else {
          // Réservation introuvable ou supprimée
          Alert.alert(
            'Erreur', 
            'Cette réservation n\'existe plus ou a été annulée.',
            [{ text: 'Retour', onPress: () => router.back() }]
          );
        }
      } catch (error) {
        console.error('Error loading chat booking:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookingAndMessages();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [bookingId, user?.id]);

  // Déterminer qui est l'interlocuteur selon mon rôle ACTIF
  const isCoiffeurView = activeRole === 'coiffeur';
  const isPending = booking?.status === 'pending';

  const otherPersonName = isCoiffeurView 
    ? (booking?.client?.full_name || 'Client') 
    : (booking?.salon?.name || 'Le Salon');
  
  const otherPersonImage = isCoiffeurView 
    ? booking?.client?.avatar_url 
    : (booking?.salon?.cover_image_url || booking?.salon?.image_url);

  const quickMessages = isCoiffeurView ? QUICK_MESSAGES_COIFFEUR : QUICK_MESSAGES_CLIENT;

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !booking) return;

    const content = inputText.trim();
    setInputText(''); // Clear input immediately for UX

    try {
      // Envoyer à la DB
      const senderType = isCoiffeurView ? 'coiffeur' : 'client';
      const newDbMsg = await messageService.sendMessage(bookingId, user.id, senderType, content);
      
      // L'ajout local sera géré par le retour de sendMessage ou par la souscription
      // Pour éviter les doublons, on vérifie dans le setMessages
      const newLocalMsg = mapDbToLocalMessage(
        newDbMsg, 
        user.id, 
        booking.salon?.name || 'Le Salon', 
        booking.client?.full_name || 'Client'
      );

      setMessages(prev => {
        if (prev.find(m => m.id === newLocalMsg.id)) return prev;
        return [...prev, newLocalMsg];
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    }
  };

  const sendQuickMessage = (text: string) => {
    setInputText(text);
  };

  if (loading || !booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      {/* Header Natif Dynamique */}
      <Stack.Screen 
        options={{ 
          headerTitle: otherPersonName,
          headerShown: true,
          headerBackTitle: 'Retour',
        }} 
      />

      {/* Booking Info Card - Remonté car le header est maintenant natif */}
      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        style={[styles.bookingCard, { backgroundColor: colors.card, marginTop: 16 }]}
      >
        <View style={styles.bookingIcon}>
          <Ionicons name="calendar" size={20} color="#7C3AED" />
        </View>
        <View style={styles.bookingInfo}>
          <Text style={[styles.bookingService, { color: colors.text }]}>
            {booking.service?.name}
          </Text>
          <Text style={[styles.bookingDateTime, { color: colors.textSecondary }]}>
            {booking.booking_date} à {booking.start_time.substring(0, 5)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#22C55E20' }]}>
          <Text style={[styles.statusText, { color: '#22C55E' }]}>Confirmé</Text>
        </View>
      </Animated.View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} currentUserId={user?.id || ''} />}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Messages */}
      <View style={styles.quickMessagesContainer}>
        <FlatList
          horizontal
          data={quickMessages}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickMessagesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.quickMessageChip, { backgroundColor: colors.card }]}
              onPress={() => sendQuickMessage(item)}
            >
              <Text style={[styles.quickMessageText, { color: colors.text }]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {isPending ? (
          <View style={[styles.pendingBanner, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.pendingIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="time" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
              {isCoiffeurView 
                ? "Acceptez ce rendez-vous pour ouvrir la discussion avec votre client."
                : "Votre rdv est en attente de confirmation. Le chat s'ouvrira dès que votre coiffeur aura accepté."}
            </Text>
          </View>
        ) : (
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={28} color="#808080" />
            </TouchableOpacity>

            <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Écrivez votre message..."
                placeholderTextColor={colors.placeholder}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#FFFFFF' : '#808080'}
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E5E5',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  headerStatus: {
    fontSize: 12,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingService: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookingDateTime: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#808080',
    textAlign: 'center',
    flex: 1,
  },
  messageBubbleContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: '#191919',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageBubbleAutomatic: {
    borderWidth: 1,
    borderColor: '#7C3AED30',
  },
  automaticTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 3,
  },
  automaticTagText: {
    fontSize: 10,
    color: '#7C3AED',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  quickMessagesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 8,
  },
  quickMessagesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickMessageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  quickMessageText: {
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#f9f8f8',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  input: {
    fontSize: 15,
    minHeight: 24,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#191919',
  },
  sendButtonInactive: {
    backgroundColor: '#E5E5E5',
  },
  pendingBanner: {
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  pendingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
