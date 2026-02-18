/**
 * Page Messages - Espace Coiffeur AfroPlan
 * Liste des conversations avec les clients
 * Accessible depuis le dashboard coiffeur
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';

interface Conversation {
  id: string;
  bookingId: string;
  clientName: string;
  clientImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  service: string;
  bookingDate: string;
  bookingStatus: 'confirmed' | 'pending' | 'completed';
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    bookingId: 'booking-1',
    clientName: 'Marie Dupont',
    clientImage: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=100',
    lastMessage: 'Bonjour, je serai un peu en retard, environ 10 minutes.',
    lastMessageTime: 'Il y a 5 min',
    unreadCount: 2,
    service: 'Box Braids',
    bookingDate: "Aujourd'hui, 14h00",
    bookingStatus: 'confirmed',
  },
  {
    id: '2',
    bookingId: 'booking-2',
    clientName: 'Aminata Bamba',
    clientImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100',
    lastMessage: '⚡ Merci pour votre réservation « Knotless Braids » 🙏 Je suis ravie…',
    lastMessageTime: 'À l\'instant',
    unreadCount: 0,
    service: 'Knotless Braids',
    bookingDate: 'Jeudi, 10h00',
    bookingStatus: 'confirmed',
  },
  {
    id: '3',
    bookingId: 'booking-3',
    clientName: 'Fatou Diallo',
    clientImage: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=100',
    lastMessage: 'Merci pour la prestation, c\'était parfait !',
    lastMessageTime: 'Hier',
    unreadCount: 0,
    service: 'Locks (entretien)',
    bookingDate: 'Hier, 10h00',
    bookingStatus: 'completed',
  },
];

export default function CoiffeurMessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [conversations] = useState(MOCK_CONVERSATIONS);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Messages</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Connectez-vous pour voir vos conversations
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: Conversation['bookingStatus']) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.accent;
      case 'completed': return colors.textMuted;
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.card }]}
      onPress={() => router.push({
        pathname: '/chat/[bookingId]',
        params: { bookingId: item.bookingId },
      })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.clientImage }} style={styles.avatar} contentFit="cover" />
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.bookingStatus) }]} />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
            {item.clientName}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {item.lastMessageTime}
          </Text>
        </View>
        <Text style={[styles.serviceLabel, { color: colors.primary }]} numberOfLines={1}>
          {item.service} - {item.bookingDate}
        </Text>
        <View style={styles.lastMessageRow}>
          <Text
            style={[
              styles.lastMessage,
              {
                color: item.unreadCount > 0 ? colors.text : colors.textSecondary,
                fontWeight: item.unreadCount > 0 ? '600' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Pas de messages</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Les conversations avec vos clients apparaitront ici une fois qu&apos;ils auront pris rendez-vous
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    flex: 1,
  },
  timeText: {
    fontSize: FontSizes.xs,
    marginLeft: Spacing.sm,
  },
  serviceLabel: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lastMessage: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  separator: {
    height: 0.5,
    marginLeft: 76,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  loginButton: {
    backgroundColor: '#191919',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
