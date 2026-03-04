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
  Dimensions,
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
import LanguageSelector from '@/components/LanguageSelector';
import FeedbackListModal from '@/components/FeedbackListModal';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile, signOut, updateProfile, isLoading, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFeedbackList, setShowFeedbackList] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSignOut = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.logout'), 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        phone: phone,
      });
      setIsEditing(false);
      Alert.alert(t('common.success'), t('auth.profileUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToCoiffeur = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'coiffeur');
    router.replace('/(coiffeur)');
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('auth.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      // Logique pour uploader l'image vers Supabase Storage
      Alert.alert('Info', 'La mise à jour de la photo sera disponible prochainement.');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-circle-outline" size={80} color={colors.textMuted} />
          <Text style={[styles.authTitle, { color: colors.text }]}>{t('auth.profile')}</Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            {t('auth.loginToManage')}
          </Text>
          <TouchableOpacity 
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.authButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Profile */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
            <Image 
              source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }} 
              style={styles.avatar} 
            />
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'Utilisateur'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{profile?.email}</Text>
          
          <TouchableOpacity 
            style={[styles.editButton, { borderColor: colors.border }]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={[styles.editButtonText, { color: colors.text }]}>{t('auth.editProfile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.settings')}</Text>
          
          <View style={[styles.menuCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSwitchToCoiffeur}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{t('role.switchToCoiffeur')}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t('role.manageYourSalon')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.menuItemNoPress}>
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="language-outline" size={22} color="#3B82F6" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{t('common.language')}</Text>
              </View>
              <LanguageSelector />
            </View>
          </View>
        </View>

        {/* Administration Section (Seulement pour Admin) */}
        {profile?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Administration</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: '#EF444420', borderWidth: 1 }, Shadows.sm]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowFeedbackList(true)}>
                <View style={[styles.menuIcon, { backgroundColor: '#EF444415' }]}>
                  <Ionicons name="chatbubbles-outline" size={22} color="#EF4444" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Retours Testeurs</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>Voir les bugs et suggestions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.support')}</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('mailto:support@afroplan.com')}>
              <View style={[styles.menuIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="help-buoy-outline" size={22} color="#10B981" />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text, flex: 1 }]}>{t('common.help')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy-policy')}>
              <View style={[styles.menuIcon, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#6366F1" />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text, flex: 1 }]}>{t('common.privacy')}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('auth.editProfile')}</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.fullName')}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('auth.fullName')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('auth.phone')}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="06 00 00 00 00"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback List Modal (Admin) */}
      <FeedbackListModal visible={showFeedbackList} onClose={() => setShowFeedbackList(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 30 },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 16 },
  editButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  editButtonText: { fontSize: 13, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  menuCard: { borderRadius: 24, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemNoPress: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700' },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 8 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  authTitle: { fontSize: 24, fontWeight: '800', marginTop: 20 },
  authSubtitle: { fontSize: 15, textAlign: 'center', marginTop: 10, marginBottom: 30 },
  authButton: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center' },
  authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 16 },
  saveButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
