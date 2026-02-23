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
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
// Import sécurisé de expo-av
let Video: any = null;
let ResizeMode: any = { COVER: 'cover', CONTAIN: 'contain' };
try {
  const ExpoAV = require('expo-av');
  Video = ExpoAV.Video;
  ResizeMode = ExpoAV.ResizeMode;
} catch (e) {
  console.warn("Module expo-av non chargé sur cet appareil.");
}

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalon } from '@/hooks/use-salons';
import { useFavorite } from '@/hooks/use-favorites';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { Button, Rating } from '@/components/ui';
import { Service } from '@/types';
import { HAIRSTYLE_CATEGORIES } from '@/constants/hairstyleCategories';

const HEADER_HEIGHT = 300;

export default function SalonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
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
        requiresExtensions: selectedService.requires_extensions ? 'true' : 'false',
        extensionsIncluded: selectedService.extensions_included ? 'true' : 'false',
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
          Ce salon n&apos;existe pas ou a ete supprime
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
          {(() => {
            const imageUri = (salon.cover_image_url && salon.cover_image_url !== '') 
              ? salon.cover_image_url 
              : (salon.image_url && salon.image_url !== '')
                ? salon.image_url
                : (salon.photos && salon.photos.length > 0)
                  ? salon.photos[0]
                  : (salon.gallery && salon.gallery.length > 0)
                    ? salon.gallery[0].image_url
                    : null;

            return (
              <View style={{ flex: 1, backgroundColor: colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={{ uri: imageUri || 'https://via.placeholder.com/400x300' }}
                  style={styles.coverImage}
                  contentFit="cover"
                  transition={500}
                />
                {!imageUri && (
                  <View style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                      <Text style={{ color: colors.textMuted, marginTop: 8 }}>Aucune photo</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}
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

          {/* Bouton Modifier (visible uniquement par le proprio) */}
          {isAuthenticated && user?.id === salon.owner_id && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: '#191919' }]}
              onPress={() => router.push('/(coiffeur)/salon')}
            >
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Modifier mon salon</Text>
            </TouchableOpacity>
          )}
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
                          {language === 'fr' ? 'À propos' : 'About'}
                        </Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                          {salon.description}
                        </Text>
                      </View>
                    )}
          
                              {/* Services - C'est ici que le client voit TOUT */}
                              <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                  {language === 'fr' ? 'Mes prestations & Styles' : 'My Styles'}
                                </Text>
                                {Object.keys(servicesByCategory).length > 0 ? (
                                  Object.entries(servicesByCategory).map(([category, services]) => (
                                    <View key={category} style={styles.serviceCategory}>
                                      <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
                                        {category}
                                      </Text>
                                      <View style={styles.servicesGrid}>
                                        {services.map((service) => (
                                          <View key={service.id} style={[
                                            styles.serviceCardGrid,
                                            { backgroundColor: colors.card },
                                            selectedService?.id === service.id && {
                                              borderColor: colors.primary,
                                              borderWidth: 2,
                                            },
                                            Shadows.sm,
                                          ]}>
                                                                    <TouchableOpacity
                                                                      style={styles.serviceMainContentGrid}
                                                                      onPress={() => setSelectedService(service)}
                                                                    >
                                                                      {/* Photo spécifique ou photo du catalogue par défaut */}
                                                                      {(() => {
                                                                        const catalogStyle = HAIRSTYLE_CATEGORIES.flatMap(c => c.styles).find(s => s.name === service.name);
                                                                        const imageSource = service.image_url 
                                                                          ? { uri: service.image_url } 
                                                                          : catalogStyle?.image;
                                            
                                                                        return (
                                                                          <Image
                                                                            source={imageSource || { uri: 'https://via.placeholder.com/300?text=Style' }}
                                                                            style={styles.serviceImageGrid}
                                                                            contentFit="cover"
                                                                            transition={300}
                                                                          />
                                                                        );
                                                                      })()}
                                                                      
                                                                      <View style={styles.serviceInfoGrid}>                                                <Text style={[styles.serviceNameGrid, { color: colors.text }]} numberOfLines={1}>
                                                  {service.name}
                                                </Text>
                                                <Text style={[styles.serviceDuration, { color: colors.textMuted, fontSize: 11 }]}>
                                                  {service.duration_minutes} min
                                                </Text>
                                                <Text style={[styles.servicePriceGrid, { color: colors.primary }]}>
                                                  {service.price}€
                                                </Text>
                                              </View>
                                              
                                              {selectedService?.id === service.id && (
                                                <View style={styles.selectedOverlay}>
                                                  <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                                                </View>
                                              )}
                                            </TouchableOpacity>
                                          </View>
                                        ))}
                                      </View>
                                    </View>
                                  ))
                                ) : (              <Text style={[styles.noServices, { color: colors.textMuted }]}>
                {language === 'fr' ? 'Aucun service disponible' : 'No services available'}
              </Text>
            )}
          </View>

          {/* Gallery */}
          {salon.gallery && salon.gallery.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'fr' ? 'Nos réalisations' : 'Our creations'}
              </Text>
              <View style={styles.galleryGrid}>
                {salon.gallery.map((image) => {
                  const isVideo = image.image_url.toLowerCase().match(/\.(mp4|mov|wmv|avi|quicktime)$/);
                  
                  return (
                    <View key={image.id} style={[styles.galleryItem, { backgroundColor: colors.card }]}>
                      {isVideo ? (
                        Video ? (
                          <Video
                            source={{ uri: image.image_url }}
                            style={styles.galleryImage}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            isLooping
                          />
                        ) : (
                          <View style={[styles.galleryImage, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="videocam" size={32} color="#FFF" />
                          </View>
                        )
                      ) : (
                        <Image
                          source={{ uri: image.image_url }}
                          style={styles.galleryImage}
                          contentFit="cover"
                        />
                      )}
                      {image.caption ? (
                        <Text style={[styles.galleryCaption, { color: colors.textSecondary }]} numberOfLines={1}>
                          {image.caption}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
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
              {language === 'fr' ? 'Sélectionnez un service' : 'Select a service'}
            </Text>
          )}
          <Button
            title={t('booking.book')}
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
  editButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  serviceCardGrid: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  serviceMainContentGrid: {
    position: 'relative',
  },
  serviceImageGrid: {
    width: '100%',
    height: 150, // Hauteur fixe pour garantir la visibilité
    backgroundColor: '#F3F4F6',
  },
  serviceInfoGrid: {
    padding: Spacing.sm,
  },
  serviceNameGrid: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  servicePriceGrid: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginTop: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  serviceCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  serviceMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: '#F3F4F6',
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
  servicePriceContainer: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
    gap: 4,
  },
  servicePrice: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  extensionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  extensionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noServices: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  salonPhotosScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  salonPhotoItem: {
    width: 240,
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  salonPhoto: {
    width: '100%',
    height: '100%',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  galleryItem: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: 160,
  },
  galleryCaption: {
    fontSize: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
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
