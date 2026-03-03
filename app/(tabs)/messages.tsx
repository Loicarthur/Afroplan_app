/**
 * Page Messages - Espace Client AfroPlan
 * Liste des conversations avec les salons
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
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { bookingService } from '@/services/booking.service';
import { BookingWithDetails } from '@/types';

export default function ClientMessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<BookingWithDetails[]>([]);

  const fetchConversations = React.useCallback(async () => {
    if (!user) return;
    try {
      // Pour le client, on récupère ses réservations qui servent de base aux conversations
      const response = await bookingService.getClientBookings(user.id);
      // On peut filtrer pour ne garder que celles qui ont potentiellement des messages ou sont actives
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching client conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Vos messages</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Connectez-vous pour discuter avec vos coiffeurs et suivre vos rendez-vous.
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#191919' }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          source={{ uri: item.salon?.image_url || 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
          contentFit="cover" 
        />
        {item.status === 'confirmed' && (
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
        )}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.salonName, { color: colors.text }]} numberOfLines={1}>
            {item.salon?.name || 'Salon'}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.serviceLabel, { color: colors.primary }]} numberOfLines={1}>
          {item.service?.name}
        </Text>
        <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.notes || "Cliquez pour envoyer un message..."}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune discussion</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Vos conversations apparaîtront ici après votre première réservation.
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { borderColor: '#191919' }]}
            onPress={() => router.push('/')}
          >
            <Text style={[styles.exploreButtonText, { color: '#191919' }]}>Explorer les salons</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  timeText: {
    fontSize: 11,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 13,
  },
  separator: {
    height: 1,
    marginHorizontal: Spacing.lg,
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    ...Shadows.md,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  exploreButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
