/**
 * Chat Screen - AfroPlan
 * Système de messagerie entre client et coiffeur
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Shadows } from '@/constants/theme';
import { bookingService, messageService, Message as DbMessage } from '@/services';
import { BookingWithDetails } from '@/types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isMe: boolean;
}

const mapDbToLocalMessage = (dbMsg: DbMessage, activeRole: string, salonName: string, clientName: string): Message => {
  return {
    id: dbMsg.id,
    text: dbMsg.content,
    senderId: dbMsg.sender_id,
    senderName: dbMsg.sender_type === 'coiffeur' ? salonName : clientName,
    timestamp: new Date(dbMsg.created_at),
    isMe: dbMsg.sender_type === activeRole,
  };
};

function MessageBubble({ message }: { message: Message }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isMe = message.isMe;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={[styles.messageBubbleContainer, isMe ? styles.messageBubbleRight : styles.messageBubbleLeft]}
    >
      <Text style={[styles.senderNameLabel, { textAlign: isMe ? 'right' : 'left', color: colors.textSecondary }]}>
        {message.senderName}
      </Text>
      <View style={[styles.bubble, { backgroundColor: isMe ? '#191919' : colors.card, borderWidth: isMe ? 0 : 1, borderColor: colors.border }]}>
        <Text style={[styles.msgText, { color: isMe ? '#FFF' : colors.text }]}>{message.text}</Text>
        <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string>('client');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let sub: any = null;
    const init = async () => {
      if (!bookingId || !user) return;
      try {
        const role = await AsyncStorage.getItem('@afroplan_selected_role') || 'client';
        setActiveRole(role);
        const data = await bookingService.getBookingById(bookingId);
        if (data) {
          setBooking(data);
          const dbMsgs = await messageService.getMessages(bookingId);
          setMessages(dbMsgs.map(m => mapDbToLocalMessage(m, role, data.salon?.name || 'Salon', data.client?.full_name || 'Client')));
          sub = messageService.subscribeToMessages(bookingId, (newM) => {
            setMessages(prev => prev.find(x => x.id === newM.id) ? prev : [...prev, mapDbToLocalMessage(newM, role, data.salon?.name || 'Salon', data.client?.full_name || 'Client')]);
          });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
    return () => sub?.unsubscribe();
  }, [bookingId, user?.id]);

  const send = async () => {
    if (!inputText.trim() || !user || !booking) return;
    const txt = inputText.trim();
    setInputText('');
    try {
      const role = activeRole as 'client' | 'coiffeur';
      const newM = await messageService.sendMessage(bookingId, user.id, role, txt);
      setMessages(prev => [...prev, mapDbToLocalMessage(newM, activeRole, booking.salon?.name || 'Salon', booking.client?.full_name || 'Client')]);
    } catch (e) { Alert.alert('Erreur', 'Envoi impossible'); }
  };

  if (loading || !booking) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerTitle: activeRole === 'coiffeur' ? booking.client?.full_name : booking.salon?.name }} />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8, backgroundColor: colors.background }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickMsgs}>
            {(activeRole === 'coiffeur' ? ["À votre service !", "Prêt pour vous !"] : ["Je suis en route !", "Merci !"]).map(t => (
              <TouchableOpacity key={t} style={[styles.chip, { backgroundColor: colors.card }]} onPress={() => setInputText(t)}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.inputRow}>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput style={{ color: colors.text, padding: 10 }} value={inputText} onChangeText={setInputText} placeholder="Écrivez..." multiline />
            </View>
            <TouchableOpacity style={[styles.send, { backgroundColor: '#191919' }]} onPress={send}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageBubbleContainer: { marginVertical: 6, maxWidth: '85%' },
  messageBubbleRight: { alignSelf: 'flex-end' },
  messageBubbleLeft: { alignSelf: 'flex-start' },
  senderNameLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase', marginHorizontal: 4 },
  bubble: { padding: 12, borderRadius: 18, ...Shadows.sm },
  msgText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  inputArea: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  quickMsgs: { padding: 8, maxHeight: 50 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  inputRow: { flexDirection: 'row', padding: 12, alignItems: 'flex-end', gap: 8 },
  inputWrap: { flex: 1, borderRadius: 24, borderWidth: 1 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
