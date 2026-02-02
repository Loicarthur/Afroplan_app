/**
 * Page des favoris AfroPlan
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/use-favorites';
import { Colors, Spacing, FontSizes } from '@/constants/theme';
import { Button, SalonCard } from '@/components/ui';
import { Salon } from '@/types';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();

  const { favorites, isLoading, refresh, removeFavorite } = useFavorites(user?.id || '');

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="heart-outline" size={80} color={colors.textMuted} />
          <Text style={[styles.authTitle, { color: colors.text }]}>
            Connectez-vous
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            Pour sauvegarder vos salons favoris, vous devez vous connecter
          </Text>
          <Button
            title="Se connecter"
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: Spacing.lg }}
          />
          <Button
            title="Creer un compte"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleRemoveFavorite = async (salonId: string) => {
    try {
      await removeFavorite(salonId);
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    }
  };

  const renderSalonItem = ({ item }: { item: Salon }) => (
    <View style={styles.salonItem}>
      <SalonCard
        salon={item}
        variant="horizontal"
        isFavorite
        onFavoritePress={() => handleRemoveFavorite(item.id)}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Aucun favori
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Explorez les salons et ajoutez vos preferes a vos favoris
      </Text>
      <Button
        title="Explorer les salons"
        onPress={() => router.push('/(tabs)/explore')}
        style={{ marginTop: Spacing.lg }}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderSalonItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            favorites.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={isLoading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  authSubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyListContent: {
    flex: 1,
  },
  salonItem: {
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
