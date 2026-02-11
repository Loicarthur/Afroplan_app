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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';


interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isMe: boolean;
  type: 'text' | 'system';
}

interface BookingInfo {
  id: string;
  clientName: string;
  coiffeurName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed';
  clientImage: string;
  coiffeurImage: string;
}

// Mock data
const MOCK_BOOKING: BookingInfo = {
  id: '1',
  clientName: 'Marie Dupont',
  coiffeurName: 'Fatou Diallo',
  service: 'Tresses africaines',
  date: 'Samedi 15 Février',
  time: '14:00',
  status: 'confirmed',
  clientImage: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200',
  coiffeurImage: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200',
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '0',
    text: 'Réservation confirmée ! Vous pouvez maintenant discuter avec votre coiffeuse.',
    senderId: 'system',
    senderName: 'Système',
    timestamp: new Date(Date.now() - 3600000 * 2),
    isMe: false,
    type: 'system',
  },
  {
    id: '1',
    text: 'Bonjour ! Je suis ravie de vous coiffer samedi. Avez-vous des références de tresses que vous aimez ?',
    senderId: 'coiffeur',
    senderName: 'Fatou',
    timestamp: new Date(Date.now() - 3600000),
    isMe: false,
    type: 'text',
  },
  {
    id: '2',
    text: 'Bonjour Fatou ! Oui j\'aimerais des box braids mi-longues. Je vous enverrai des photos.',
    senderId: 'client',
    senderName: 'Marie',
    timestamp: new Date(Date.now() - 1800000),
    isMe: true,
    type: 'text',
  },
  {
    id: '3',
    text: 'Parfait ! N\'hésitez pas. Aussi, souhaitez-vous une couleur particulière ?',
    senderId: 'coiffeur',
    senderName: 'Fatou',
    timestamp: new Date(Date.now() - 900000),
    isMe: false,
    type: 'text',
  },
];

// Quick message suggestions
const QUICK_MESSAGES = [
  "J'aurai un peu de retard",
  "Je suis en route",
  "À quelle heure exactement ?",
  "Pouvez-vous m'envoyer l'adresse ?",
];

function MessageBubble({ message }: { message: Message }) {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={[
        styles.messageBubbleContainer,
        message.isMe ? styles.messageBubbleRight : styles.messageBubbleLeft,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isMe
            ? styles.messageBubbleMe
            : [styles.messageBubbleOther, { backgroundColor: colors.card }],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isMe
              ? styles.messageTextMe
              : { color: colors.text },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.isMe ? styles.messageTimeMe : { color: colors.textMuted },
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
  const { profile } = useAuth();
  useLocalSearchParams<{ bookingId: string }>();

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [booking] = useState<BookingInfo>(MOCK_BOOKING);
  const flatListRef = useRef<FlatList>(null);

  const isCoiffeur = profile?.role === 'coiffeur';
  const otherPersonName = isCoiffeur ? booking.clientName : booking.coiffeurName;
  const otherPersonImage = isCoiffeur ? booking.clientImage : booking.coiffeurImage;

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: isCoiffeur ? 'coiffeur' : 'client',
      senderName: profile?.full_name || 'Moi',
      timestamp: new Date(),
      isMe: true,
      type: 'text',
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendQuickMessage = (text: string) => {
    setInputText(text);
  };

  useEffect(() => {
    // Scroll to bottom on mount
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 300);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#191919" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerProfile}>
          <Image
            source={{ uri: otherPersonImage }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.text }]}>
              {otherPersonName}
            </Text>
            <View style={styles.headerOnline}>
              <View style={styles.onlineDot} />
              <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
                En ligne
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#191919" />
        </TouchableOpacity>
      </View>

      {/* Booking Info Card */}
      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        style={[styles.bookingCard, { backgroundColor: colors.card }]}
      >
        <View style={styles.bookingIcon}>
          <Ionicons name="calendar" size={20} color="#7C3AED" />
        </View>
        <View style={styles.bookingInfo}>
          <Text style={[styles.bookingService, { color: colors.text }]}>
            {booking.service}
          </Text>
          <Text style={[styles.bookingDateTime, { color: colors.textSecondary }]}>
            {booking.date} à {booking.time}
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
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Messages */}
      <View style={styles.quickMessagesContainer}>
        <FlatList
          horizontal
          data={QUICK_MESSAGES}
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
});
