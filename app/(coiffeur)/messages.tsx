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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/theme';
import { bookingService } from '@/services/booking.service';
import { salonService } from '@/services/salon.service';
import { BookingWithDetails } from '@/types';

export default function CoiffeurMessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<BookingWithDetails[]>([]);

  const fetchConversations = React.useCallback(async () => {
    if (!user) return;
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const response = await bookingService.getSalonBookings(salon.id);
        // On trie pour avoir les plus récents en premier
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error fetching salon conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.accent;
      case 'completed': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const renderConversation = ({ item }: { item: BookingWithDetails }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.card }]}
      onPress={() => router.push({
        pathname: '/chat/[bookingId]',
        params: { bookingId: item.id },
      })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrapper}>
        <Image 
          source={{ uri: item.client?.avatar_url || 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
          contentFit="cover" 
        />
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.clientName, { color: colors.text }]} numberOfLines={1}>
            {item.client?.full_name || 'Client'}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {item.start_time.substring(0, 5)}
          </Text>
        </View>
        <Text style={[styles.serviceLabel, { color: colors.primary }]} numberOfLines={1}>
          {item.service?.name} - {item.booking_date}
        </Text>
        <View style={styles.lastMessageRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {item.notes || "Cliquer pour discuter avec le client"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
