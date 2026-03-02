/**
 * Page Profil Client - AfroPlan
 * Design épuré inspiré de l'espace coiffeur
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { clientService } from '@/services/client.service';
import { supabase } from '@/lib/supabase';
import { BookingWithDetails } from '@/types';
import NotificationModal from '@/components/NotificationModal';
import LanguageSelector from '@/components/LanguageSelector';
import { Button } from '@/components/ui';

/* ---------- MENU ITEM COMPONENT ---------- */
type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
  badge?: number;
};

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger = false, badge }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.error + '15' : colors.backgroundSecondary }]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: danger ? colors.error : colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

/* ---------- MAIN SCREEN ---------- */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, signOut, isAuthenticated, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>([]);
  const [profileStats, setProfileStats] = useState<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    favoriteCategories: string[];
    visitedSalonsCount: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Formulaire Edition
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [newPhone, setNewPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const TRANSLATED_STATUS_CONFIG = {
    completed: { label: t('booking.completed'), color: '#22C55E', icon: 'checkmark-circle' as const },
    pending: { label: t('booking.pending'), color: '#F59E0B', icon: 'time' as const },
    confirmed: { label: t('booking.confirmed'), color: '#3B82F6', icon: 'checkmark-circle' as const },
    cancelled: { label: t('booking.cancelled'), color: '#EF4444', icon: 'close-circle' as const },
  };

  useEffect(() => {
    if (profile) {
      setNewName(profile.full_name || '');
      setNewPhone(profile.phone || '');
    }
  }, [profile]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [statsData, bookingsData] = await Promise.all([
        clientService.getClientStats(user.id),
        clientService.getBookingHistory(user.id, 1)
      ]);
      setProfileStats(statsData);
      setRecentBookings(bookingsData.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  const handleUpdateAvatar = async () => {
    if (!user?.id) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la galerie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const uri = result.assets[0].uri;

      // Correction Android: Utiliser FormData au lieu de blob()
      const formData = new FormData();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
      
      const file = {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      } as any;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('salon-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('salon-photos')
        .getPublicUrl(uploadData.path);

      await updateProfile({ avatar_url: publicUrl });
      Alert.alert('Succès', 'Votre photo de profil a été mise à jour !');
    } catch (error: any) {
      console.error('Avatar update error:', error);
      Alert.alert('Erreur', "Impossible de mettre à jour votre photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: newName.trim(),
        phone: newPhone.trim(),
      });
      Alert.alert("Succès", "Votre profil a été mis à jour.");
      setEditProfileModalVisible(false);
    } catch (error) {
      console.error("Save Profile Error:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              if (__DEV__) console.error('Erreur déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const handleSwitchToCoiffeur = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'coiffeur');
    router.replace('/(coiffeur)');
  };

  // Si pas connecté → écran invitant à se connecter
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mon profil</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Connectez-vous pour gérer votre profil, vos rendez-vous et vos messages
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.authLink, { color: colors.primary }]}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.full_name || t('profile.user');
  const displayEmail = profile?.email || user?.email || '';
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── PROFILE HEADER ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.card }]}
              onPress={handleUpdateAvatar}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="camera" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {displayEmail}
          </Text>
        </View>

        {/* ── STATS SECTION ── */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profileStats?.totalBookings ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.rdv')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profileStats?.visitedSalonsCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.salons')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profileStats?.totalSpent ?? 0}€
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.spent')}</Text>
          </View>
        </View>

        {/* ── SWITCH MODE COIFFEUR ── */}
        <View style={styles.switchSection}>
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleSwitchToCoiffeur}
            activeOpacity={0.7}
          >
            <Ionicons name="cut-outline" size={24} color={colors.primary} />
            <View style={styles.switchContent}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>
                {t('profile.modeCoiffeur')}
              </Text>
              <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                {t('profile.switchToCoiffeur')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── RENDEZ-VOUS RÉCENTS ── */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
              {t('profile.recentBookings')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/reservations')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('profile.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.menuGroup, Shadows.sm]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
            ) : recentBookings.length > 0 ? (
              recentBookings.map(booking => {
                const statusConfig = (TRANSLATED_STATUS_CONFIG[booking.status as keyof typeof TRANSLATED_STATUS_CONFIG] || TRANSLATED_STATUS_CONFIG.pending);
                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={[styles.bookingCard, { backgroundColor: colors.card }]}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/chat/[bookingId]',
                      params: { bookingId: booking.id },
                    })}
                  >
                    <View style={[styles.bookingIconContainer, { backgroundColor: statusConfig.color + '15' }]}>
                      <Ionicons name={statusConfig.icon} size={22} color={statusConfig.color} />
                    </View>
                    <View style={styles.bookingContent}>
                      <Text style={[styles.bookingSalon, { color: colors.text }]}>{booking.salon?.name || 'Salon'}</Text>
                      <Text style={[styles.bookingService, { color: colors.textSecondary }]}>
                        {booking.service?.name || 'Service'} · {booking.booking_date}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted }}>{t('profile.noRecentBookings')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── MESSAGES & ALERTES ── */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            {t('profile.messagesAlerts')}
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="chatbubbles-outline"
              title={t('profile.myConversations')}
              subtitle={t('profile.myConversationsDesc')}
              onPress={() => router.push('/(tabs)/reservations')}
            />
            <MenuItem
              icon="notifications-outline"
              title={t('profile.notifications')}
              subtitle={t('profile.notificationsDesc')}
              onPress={() => setNotificationModalVisible(true)}
            />
          </View>
        </View>

        {/* ── COMPTE ── */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>
            {t('profile.account')}
          </Text>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="person-outline"
              title={t('profile.editProfile')}
              subtitle={t('profile.editProfileDesc')}
              onPress={() => setEditProfileModalVisible(true)}
            />
            <MenuItem
              icon="settings-outline"
              title={t('profile.settings')}
              subtitle={t('profile.settingsDesc')}
              onPress={() => setSettingsModalVisible(true)}
            />
            <MenuItem
              icon="help-circle-outline"
              title={t('profile.helpSupport')}
              onPress={() => Linking.openURL('mailto:support@afroplan.com')}
            />
          </View>
        </View>

        {/* ── DÉCONNEXION ── */}
        <View style={styles.menuSection}>
          <View style={[styles.menuGroup, Shadows.sm]}>
            <MenuItem
              icon="log-out-outline"
              title={t('profile.logout')}
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: colors.textMuted }]}>AfroPlan</Text>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* MODAL MODIFICATION PROFIL */}
      <Modal
        visible={editProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.editProfileTitle')}</Text>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('profile.fullName')}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={newName}
                onChangeText={setNewName}
                placeholder={t('profile.fullName')}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('profile.phone')}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Ex: 06 12 34 56 78"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <Button
              title={isSaving ? t('common.loading') : t('profile.saveChanges')}
              onPress={handleSaveProfile}
              loading={isSaving}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL PARAMÈTRES */}
      <Modal
        visible={settingsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.settings')}</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 16, color: colors.text }}>{t('profile.appLanguage')}</Text>
            <LanguageSelector />

            <View style={{ height: 30 }} />
            
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 16, color: colors.text }}>{t('profile.preferences')}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.text }}>{t('profile.pushNotifications')}</Text>
              <Ionicons name="toggle" size={32} color={colors.primary} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: colors.text }}>{t('profile.darkMode')}</Text>
              <Ionicons name="toggle" size={32} color={colors.primary} />
            </View>
          </View>
        </View>
      </Modal>

      <NotificationModal 
        visible={notificationModalVisible} 
        onClose={() => setNotificationModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  editAvatarButton: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  profileName: { fontSize: FontSizes.xxl, fontWeight: '700', marginTop: Spacing.md },
  profileEmail: { fontSize: FontSizes.md, marginTop: Spacing.xs },
  statsSection: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm },
  statCard: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.lg },
  statValue: { fontSize: FontSizes.lg, fontWeight: '700' },
  statLabel: { fontSize: FontSizes.xs, marginTop: 2, textTransform: 'uppercase' },
  switchSection: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  switchButton: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  switchContent: { flex: 1, marginLeft: Spacing.md },
  switchTitle: { fontSize: FontSizes.md, fontWeight: '600' },
  switchSubtitle: { fontSize: FontSizes.sm, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  seeAllText: { fontSize: FontSizes.sm, fontWeight: '600' },
  menuSection: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  menuSectionTitle: { fontSize: FontSizes.sm, fontWeight: '600', marginBottom: Spacing.sm, textTransform: 'uppercase' },
  menuGroup: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  menuIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuContent: { flex: 1, marginLeft: Spacing.md },
  menuTitle: { fontSize: FontSizes.md, fontWeight: '500' },
  menuSubtitle: { fontSize: FontSizes.sm, marginTop: 2 },
  badge: { backgroundColor: '#EF4444', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginRight: Spacing.sm },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  bookingCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' },
  bookingIconContainer: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  bookingContent: { flex: 1, marginLeft: Spacing.md },
  bookingSalon: { fontSize: FontSizes.md, fontWeight: '600' },
  bookingService: { fontSize: FontSizes.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: 11, fontWeight: '600' },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.lg },
  appName: { fontSize: FontSizes.md, fontWeight: '600' },
  appVersion: { fontSize: FontSizes.sm, marginTop: Spacing.xs },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  authIconContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  authTitle: { fontSize: FontSizes.xxl, fontWeight: '700', marginBottom: Spacing.sm },
  authMessage: { fontSize: FontSizes.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  authButton: { backgroundColor: '#191919', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  authButtonText: { color: '#FFFFFF', fontSize: FontSizes.md, fontWeight: '600' },
  authLink: { fontSize: FontSizes.md, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, ...Shadows.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },
});
