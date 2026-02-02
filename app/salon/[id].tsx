/**
 * Page de detail d'un salon AfroPlan
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSalon } from '@/hooks/use-salons';
import { useFavorite } from '@/hooks/use-favorites';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button, Rating } from '@/components/ui';
import { Service } from '@/types';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

export default function SalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const { salon, isLoading, error } = useSalon(id || '');
  const { isFavorite, toggle: toggleFavorite, isToggling } = useFavorite(
    user?.id || '',
    id || ''
  );

  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleCall = () => {
    if (salon?.phone) {
      Linking.openURL(`tel:${salon.phone}`);
    }
  };

  const handleEmail = () => {
    if (salon?.email) {
      Linking.openURL(`mailto:${salon.email}`);
    }
  };

  const handleWebsite = () => {
    if (salon?.website) {
      Linking.openURL(salon.website);
    }
  };

  const handleDirections = () => {
    if (salon?.latitude && salon?.longitude) {
      const url = `https://maps.google.com/?q=${salon.latitude},${salon.longitude}`;
      Linking.openURL(url);
    } else if (salon?.address) {
      const query = encodeURIComponent(`${salon.address}, ${salon.city}`);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez etre connecte pour reserver',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    if (!selectedService) {
      Alert.alert('Attention', 'Veuillez selectionner un service');
      return;
    }

    // Navigate to booking flow with service details
    router.push({
      pathname: '/booking/[id]',
      params: {
        id: id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price.toString(),
        serviceDuration: selectedService.duration_minutes.toString(),
      },
    });
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez etre connecte pour ajouter aux favoris',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    await toggleFavorite();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  if (error || !salon) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Salon introuvable
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          Ce salon n'existe pas ou a ete supprime
        </Text>
        <Button
          title="Retour"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    );
  }

  // Group services by category
  const servicesByCategory = salon.services?.reduce((acc, service) => {
    const category = service.category || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>) || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerImage}>
          <Image
            source={{
              uri: salon.cover_image_url || salon.image_url || 'https://via.placeholder.com/400x300',
            }}
            style={styles.coverImage}
            contentFit="cover"
          />
          <View style={styles.headerOverlay} />
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: colors.card }]}
            onPress={handleFavorite}
            disabled={isToggling}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Salon Info */}
        <View style={styles.content}>
          <View style={styles.salonHeader}>
            <View style={styles.salonInfo}>
              <Text style={[styles.salonName, { color: colors.text }]}>
                {salon.name}
              </Text>
              {salon.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>
                    Verifie
                  </Text>
                </View>
              )}
            </View>
            <Rating
              value={salon.rating}
              showValue
              showCount
              count={salon.reviews_count}
            />
          </View>

          {/* Address */}
          <TouchableOpacity style={styles.addressContainer} onPress={handleDirections}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.address, { color: colors.textSecondary }]}>
              {salon.address}, {salon.postal_code} {salon.city}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {salon.phone && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleCall}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>Appeler</Text>
              </TouchableOpacity>
            )}
            {salon.email && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleEmail}
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.text }]}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleDirections}
            >
              <Ionicons name="navigate-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Itineraire</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {salon.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                A propos
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {salon.description}
              </Text>
            </View>
          )}

          {/* Services */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Services
            </Text>
            {Object.keys(servicesByCategory).length > 0 ? (
              Object.entries(servicesByCategory).map(([category, services]) => (
                <View key={category} style={styles.serviceCategory}>
                  <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
                    {category}
                  </Text>
                  {services.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceCard,
                        { backgroundColor: colors.card },
                        selectedService?.id === service.id && {
                          borderColor: colors.primary,
                          borderWidth: 2,
                        },
                        Shadows.sm,
                      ]}
                      onPress={() => setSelectedService(service)}
                    >
                      <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceName, { color: colors.text }]}>
                          {service.name}
                        </Text>
                        {service.description && (
                          <Text
                            style={[styles.serviceDescription, { color: colors.textSecondary }]}
                            numberOfLines={2}
                          >
                            {service.description}
                          </Text>
                        )}
                        <Text style={[styles.serviceDuration, { color: colors.textMuted }]}>
                          {service.duration_minutes} min
                        </Text>
                      </View>
                      <Text style={[styles.servicePrice, { color: colors.primary }]}>
                        {service.price} EUR
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            ) : (
              <Text style={[styles.noServices, { color: colors.textMuted }]}>
                Aucun service disponible
              </Text>
            )}
          </View>

          {/* Gallery */}
          {salon.gallery && salon.gallery.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Galerie
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {salon.gallery.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.image_url }}
                    style={styles.galleryImage}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Spacing for bottom button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Book Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <View style={styles.bottomBarContent}>
          {selectedService ? (
            <View>
              <Text style={[styles.selectedServiceName, { color: colors.text }]}>
                {selectedService.name}
              </Text>
              <Text style={[styles.selectedServicePrice, { color: colors.primary }]}>
                {selectedService.price} EUR
              </Text>
            </View>
          ) : (
            <Text style={[styles.selectServiceHint, { color: colors.textSecondary }]}>
              Selectionnez un service
            </Text>
          )}
          <Button
            title="Reserver"
            onPress={handleBook}
            disabled={!selectedService}
            style={{ minWidth: 120 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  errorSubtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  headerImage: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  favoriteButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  salonHeader: {
    marginBottom: Spacing.md,
  },
  salonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  salonName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  verifiedText: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  address: {
    flex: 1,
    fontSize: FontSizes.md,
    marginLeft: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
  serviceCategory: {
    marginBottom: Spacing.md,
  },
  categoryName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  serviceDuration: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  servicePrice: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },
  noServices: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  galleryImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedServiceName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  selectedServicePrice: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  selectServiceHint: {
    fontSize: FontSizes.md,
  },
});
