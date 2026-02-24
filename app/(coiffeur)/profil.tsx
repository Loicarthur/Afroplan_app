/**
 * Page profil - Espace Coiffeur AfroPlan
 * Intégration complète : Portefeuille, Historique, Paramètres et Mes Clients
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { bookingService } from '@/services/booking.service';
import { salonService } from '@/services/salon.service';
import { BookingWithDetails } from '@/types';

const { width, height } = Dimensions.get('window');

// Données fictives pour les clients
const MOCK_CLIENTS = [
  { id: '1', name: 'Marie Dupont', phone: '+33 6 12 34 56 78', lastVisit: '12 Fév 2025', visitsCount: 4, notes: 'Cuir chevelu sensible. Préfère les tresses pas trop serrées.', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Fatou Diallo', phone: '+33 6 98 76 54 32', lastVisit: '05 Fév 2025', visitsCount: 12, notes: "Utilise la coloration miel #4. Toujours à l'heure.", avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '3', name: 'Awa Sylla', phone: '+33 7 11 22 33 44', lastVisit: '28 Jan 2025', visitsCount: 1, notes: 'Première visite. Cheveux très épais, prévoir 30min de plus pour le démêlage.', avatar: 'https://i.pravatar.cc/150?img=9' },
];

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
};

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger = false }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.error + '10' : colors.primary + '08' }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: danger ? colors.error : colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function CoiffeurProfilScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, profile, signOut, isAuthenticated } = useAuth();

  // États pour les Modals
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [clientsModalVisible, setClientsModalVisible] = useState(false);
  const [clientDetailModalVisible, setClientDetailModalVisible] = useState(false);

  // États pour les données
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [balance, setBalance] = useState(0);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientNotes, setClientNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // États pour les formulaires
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  // États pour le RIB
  const [iban, setIban] = useState('FR7612345678901234567890123');
  const [accountHolder, setAccountHolder] = useState(profile?.full_name || 'TITULAIRE DU COMPTE');
  const [isSavingBank, setIsSavingBank] = useState(false);

  // États Sécurité & Confidentialité
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const fetchFinancialData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const salon = await salonService.getSalonByOwnerId(user.id);
      if (salon) {
        const response = await bookingService.getSalonBookings(salon.id);
        setBookings(response.data);
        const total = response.data
          .filter(b => b.status === 'completed' || b.status === 'confirmed')
          .reduce((sum, b) => sum + b.total_price, 0);
        setBalance(total);
      }
    } catch (error) {
      console.error('Erreur données financières:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (walletModalVisible || historyModalVisible)) {
      fetchFinancialData();
    }
  }, [isAuthenticated, walletModalVisible, historyModalVisible]);

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Souhaitez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => { await signOut(); router.replace('/onboarding'); } }
    ]);
  };

  const handleSwitchToClient = async () => {
    await AsyncStorage.setItem('@afroplan_selected_role', 'client');
    router.replace('/(tabs)');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    Alert.alert('Succès', 'Informations mises à jour.');
    setInfoModalVisible(false);
    setIsSaving(false);
  };

  const handleSaveBank = async () => {
    if (!iban || !accountHolder) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs bancaires.');
      return;
    }
    setIsSavingBank(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    Alert.alert('Succès', 'Vos coordonnées bancaires ont été mises à jour.');
    setBankModalVisible(false);
    setIsSavingBank(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas ou sont vides.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setIsUpdatingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    Alert.alert('Succès', 'Votre mot de passe a été modifié.');
    setPasswordModalVisible(false);
    setNewPassword('');
    setConfirmPassword('');
    setIsUpdatingPassword(false);
  };

  const openClientDetails = (client: any) => {
    setSelectedClient(client);
    setClientNotes(client.notes);
    setClientDetailModalVisible(true);
  };

  const CustomModal = ({ visible, onClose, title, children, heightFactor = 0.85 }: any) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background, height: height * heightFactor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}><Ionicons name="person" size={48} color={colors.textMuted} /></View>
          <Text style={[styles.authTitle, { color: colors.text }]}>Mon profil Pro</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>Connectez-vous pour gérer votre activité professionnelle</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push({ pathname: '/(auth)/login', params: { role: 'coiffeur' } })}>
            <Text style={styles.authButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={[colors.primary, '#4A4A4A']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.card }]} activeOpacity={0.8}>
              <Ionicons name="camera" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{profile?.full_name || 'Coiffeur'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email || user?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: '#22C55E15' }]}>
              <Ionicons name="shield-checkmark" size={12} color="#22C55E" />
              <Text style={[styles.roleBadgeText, { color: '#22C55E' }]}>Compte Vérifié</Text>
            </View>
          </View>
        </View>

        {/* QUICK STATS */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>4.9</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Note</Text>
          </View>
          <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>124</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Ventes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>3 ans</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Exp.</Text>
          </View>
        </View>

        {/* MODE SWITCH */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.switchCard, { backgroundColor: '#191919' }]} onPress={handleSwitchToClient} activeOpacity={0.9}>
            <View style={styles.switchIconBg}><Ionicons name="swap-horizontal" size={22} color="#191919" /></View>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Passer en Mode Client</Text>
              <Text style={styles.switchSubtitle}>Réserver une prestation Afro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* BOUTIQUE */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Gestion Boutique</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem icon="storefront-outline" title="Mon Salon" subtitle="Horaires, photos, adresse" onPress={() => router.push('/(coiffeur)/salon')} />
            <MenuItem icon="cut-outline" title="Mes Services" subtitle="Tarifs et durées" onPress={() => router.push('/(coiffeur)/services')} />
            <MenuItem icon="images-outline" title="Mon Portfolio" subtitle="Vos plus belles réalisations" onPress={() => router.push('/(coiffeur)/portfolio')} />
            <MenuItem icon="people-outline" title="Mes Clients" subtitle="Fiches et historique technique" onPress={() => setClientsModalVisible(true)} />
          </View>
        </View>

        {/* PAIEMENTS & REVENUS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Paiements & Revenus</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem icon="wallet-outline" title="Portefeuille" subtitle="Solde disponible et virements" onPress={() => setWalletModalVisible(true)} />
            <MenuItem icon="receipt-outline" title="Historique des gains" subtitle="Liste détaillée des revenus" onPress={() => setHistoryModalVisible(true)} />
          </View>
        </View>

        {/* PARAMÈTRES */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Paramètres</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem icon="person-outline" title="Informations Personnelles" onPress={() => setInfoModalVisible(true)} />
            <MenuItem icon="notifications-outline" title="Notifications" onPress={() => setNotifModalVisible(true)} />
            <MenuItem icon="shield-outline" title="Confidentialité & Sécurité" onPress={() => setSecurityModalVisible(true)} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.menuGroup, { backgroundColor: colors.card }, Shadows.sm]}>
            <MenuItem icon="log-out-outline" title="Se déconnecter" onPress={handleSignOut} showChevron={false} danger />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>AfroPlan Pro Edition</Text>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>v1.0.0 Stable</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODALS ── */}

      {/* 1. Portefeuille */}
      <CustomModal visible={walletModalVisible} onClose={() => setWalletModalVisible(false)} title="Portefeuille">
        <LinearGradient colors={['#191919', '#444']} style={styles.walletCard}>
          <Text style={styles.walletCardLabel}>Solde à reverser</Text>
          <Text style={styles.walletCardValue}>{balance.toFixed(2)} €</Text>
          <View style={styles.transferInfoBadge}>
            <Ionicons name="calendar-outline" size={14} color="#FFF" />
            <Text style={styles.transferInfoText}>Virement automatique chaque lundi</Text>
          </View>
        </LinearGradient>

        <View style={[styles.infoAlert, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoAlertText, { color: colors.textSecondary }]}>
            Vos gains sont transférés sur votre compte bancaire chaque lundi matin de manière automatique.
          </Text>
        </View>

        <View style={[styles.bankInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bankHeader}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={[styles.bankTitle, { color: colors.text }]}>Coordonnées Bancaires</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>Titulaire :</Text>
            <Text style={[styles.bankDetailValue, { color: colors.text }]}>{accountHolder}</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={[styles.bankDetailLabel, { color: colors.textSecondary }]}>IBAN :</Text>
            <Text style={[styles.bankDetailValue, { color: colors.text }]}>
              {iban.substring(0, 4)} **** **** **** **** {iban.substring(iban.length - 4)}
            </Text>
          </View>
          <TouchableOpacity style={styles.bankEditBtn} onPress={() => setBankModalVisible(true)}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.bankEdit, { color: colors.primary }]}>Modifier le RIB</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>

      {/* MODAL MODIF RIB */}
      <CustomModal visible={bankModalVisible} onClose={() => setBankModalVisible(false)} title="Modifier le RIB" heightFactor={0.7}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>NOM DU TITULAIRE</Text>
          <TextInput 
            style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={accountHolder} 
            onChangeText={setAccountHolder}
            placeholder="Nom tel qu'il apparaît sur le RIB"
          />
          <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 20 }]}>IBAN</Text>
          <TextInput 
            style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={iban} 
            onChangeText={setIban}
            placeholder="FR76 ..."
            autoCapitalize="characters"
          />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#191919' }]} onPress={handleSaveBank} disabled={isSavingBank}>
            {isSavingBank ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Mettre à jour le RIB</Text>}
          </TouchableOpacity>
        </View>
      </CustomModal>

      {/* 2. Historique des gains */}
      <CustomModal visible={historyModalVisible} onClose={() => setHistoryModalVisible(false)} title="Historique des gains">
        <View style={styles.historyStats}>
          <View style={[styles.historyStatBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.historyStatLabel, { color: colors.textSecondary }]}>Total cumulé</Text>
            <Text style={[styles.historyStatValue, { color: colors.text }]}>{balance.toFixed(0)}€</Text>
          </View>
          <View style={[styles.historyStatBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.historyStatLabel, { color: colors.textSecondary }]}>Ce mois</Text>
            <Text style={[styles.historyStatValue, { color: colors.text }]}>{(balance * 0.4).toFixed(0)}€</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.modalListTitle, { color: colors.text, marginBottom: 0 }]}>Toutes les transactions</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
            onPress={() => Alert.alert('Export', 'Le rapport comptable PDF a été envoyé à votre adresse email.')}
          >
            <Ionicons name="download-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Exporter PDF</Text>
          </TouchableOpacity>
        </View>
        {loadingData ? <ActivityIndicator size="small" color={colors.primary} /> : bookings.length === 0 ? <Text style={{ textAlign: 'center', marginTop: 20 }}>Aucun gain.</Text> : bookings.map(b => (
          <View key={b.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <View style={styles.historyIcon}><Ionicons name="trending-up" size={18} color="#22C55E" /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.historyItemName, { color: colors.text }]}>{b.service?.name}</Text>
              <Text style={[styles.historyItemSub, { color: colors.textSecondary }]}>{new Date(b.booking_date).toLocaleDateString()} • {b.client?.full_name}</Text>
            </View>
            <Text style={[styles.historyItemPrice, { color: colors.success }]}>+{b.total_price.toFixed(2)}€</Text>
          </View>
        ))}
      </CustomModal>

      {/* 3. Infos Personnelles */}
      <CustomModal visible={infoModalVisible} onClose={() => setInfoModalVisible(false)} title="Infos Personnelles">
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>NOM COMPLET</Text>
          <TextInput style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={fullName} onChangeText={setFullName} />
          <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 20 }]}>EMAIL</Text>
          <TextInput style={[styles.formInput, { backgroundColor: colors.backgroundSecondary, color: colors.textMuted, borderColor: colors.border }]} value={profile?.email || ''} editable={false} />
          <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 20 }]}>TÉLÉPHONE</Text>
          <TextInput style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#191919' }]} onPress={handleSaveProfile} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Sauvegarder</Text>}
          </TouchableOpacity>
        </View>
      </CustomModal>

      {/* 4. Notifications */}
      <CustomModal visible={notifModalVisible} onClose={() => setNotifModalVisible(false)} title="Notifications">
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.text }]}>Réservations</Text><Text style={[styles.settingSub, { color: colors.textSecondary }]}>Alertes pour les nouveaux RDV</Text></View>
          <Switch value={notifBookings} onValueChange={setNotifBookings} trackColor={{ true: colors.primary }} />
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={[styles.settingLabel, { color: colors.text }]}>Messages</Text><Text style={[styles.settingSub, { color: colors.textSecondary }]}>Alertes pour les discussions clients</Text></View>
          <Switch value={notifMessages} onValueChange={setNotifMessages} trackColor={{ true: colors.primary }} />
        </View>
      </CustomModal>

      {/* 5. Confidentialité & Sécurité */}
      <CustomModal visible={securityModalVisible} onClose={() => setSecurityModalVisible(false)} title="Confidentialité & Sécurité">
        <Text style={[styles.modalSectionTitleSmall, { color: colors.textSecondary }]}>SÉCURITÉ DU COMPTE</Text>
        <TouchableOpacity style={styles.securityLink} onPress={() => setPasswordModalVisible(true)}>
          <Text style={[styles.securityLinkText, { color: colors.text }]}>Modifier le mot de passe</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.securityLink}>
          <Text style={[styles.securityLinkText, { color: colors.text }]}>Double authentification (2FA)</Text>
          <Switch value={twoFactorAuth} onValueChange={setTwoFactorAuth} trackColor={{ true: colors.primary }} />
        </View>

        <Text style={[styles.modalSectionTitleSmall, { color: colors.textSecondary, marginTop: 32 }]}>CONFIDENTIALITÉ</Text>
        <View style={styles.securityLink}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityLinkText, { color: colors.text }]}>Profil public visible</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Si désactivé, votre salon n'apparaîtra plus en recherche.</Text>
          </View>
          <Switch value={isProfileVisible} onValueChange={setIsProfileVisible} trackColor={{ true: colors.primary }} />
        </View>
        <TouchableOpacity style={styles.securityLink}>
          <Text style={[styles.securityLinkText, { color: colors.text }]}>Clients bloqués</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.securityLink, { marginTop: 32 }]} onPress={() => Alert.alert('Attention', 'Voulez-vous vraiment supprimer votre compte ?')}>
          <Text style={[styles.securityLinkText, { color: colors.error }]}>Supprimer mon compte professionnel</Text>
        </TouchableOpacity>
      </CustomModal>

      {/* MODAL MODIF MOT DE PASSE */}
      <CustomModal visible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)} title="Changer le mot de passe" heightFactor={0.7}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>NOUVEAU MOT DE PASSE</Text>
          <TextInput 
            style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            secureTextEntry 
            value={newPassword} 
            onChangeText={setNewPassword} 
            placeholder="Min. 6 caractères"
          />
          <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 20 }]}>CONFIRMATION</Text>
          <TextInput 
            style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            secureTextEntry 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="Répétez le mot de passe"
          />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#191919' }]} onPress={handleUpdatePassword} disabled={isUpdatingPassword}>
            {isUpdatingPassword ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Mettre à jour le mot de passe</Text>}
          </TouchableOpacity>
        </View>
      </CustomModal>

      {/* 6. Mes Clients */}
      <CustomModal visible={clientsModalVisible} onClose={() => setClientsModalVisible(false)} title="Mes Clients">
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un client..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {MOCK_CLIENTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(client => (
          <TouchableOpacity 
            key={client.id} 
            style={[styles.clientCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openClientDetails(client)}
          >
            <Image source={{ uri: client.avatar }} style={styles.avatarMini} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.clientName, { color: colors.text }]}>{client.name}</Text>
              <Text style={[styles.clientSub, { color: colors.textSecondary }]}>Dernier RDV : {client.lastVisit}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </CustomModal>

      {/* 7. Détails Client */}
      <CustomModal visible={clientDetailModalVisible} onClose={() => setClientDetailModalVisible(false)} title="Fiche Client" heightFactor={0.9}>
        {selectedClient && (
          <View>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Image source={{ uri: selectedClient.avatar }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              <Text style={[styles.profileName, { color: colors.text, marginTop: 12 }]}>{selectedClient.name}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{selectedClient.phone}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.text }]}>{selectedClient.visitsCount}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>Visites</Text></View>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.text }]}>{selectedClient.lastVisit}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>Dernier RDV</Text></View>
            </View>
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>Notes techniques privées</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>Visible uniquement par vous.</Text>
              <TextInput
                style={[styles.notesInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                multiline
                numberOfLines={6}
                value={clientNotes}
                onChangeText={setClientNotes}
                placeholder="Préférences, allergies, formules..."
              />
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#191919' }]} onPress={() => { Alert.alert('Succès', 'Notes sauvegardées'); setClientDetailModalVisible(false); }}>
                <Text style={styles.submitText}>Sauvegarder les notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </CustomModal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#FFF' },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  headerInfo: { marginLeft: 20, flex: 1 },
  profileName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  profileEmail: { fontSize: 14, marginTop: 2, opacity: 0.7 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8, gap: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', marginHorizontal: 24, paddingVertical: 20, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 20, marginBottom: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  section: { marginBottom: 24, paddingHorizontal: 24 },
  sectionHeader: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 },
  switchCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, ...Shadows.md },
  switchIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  switchTextContainer: { flex: 1, marginLeft: 16 },
  switchTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  switchSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  menuGroup: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuContent: { flex: 1, marginLeft: 16 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.6 },
  footer: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  footerText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  footerVersion: { fontSize: 11, marginTop: 4 },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  authTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  authMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  authButton: { backgroundColor: '#191919', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16 },
  authButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.85 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeButton: { padding: 4 },
  modalScroll: { padding: 24 },
  
  // Wallet Modal
  walletCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  walletCardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 },
  walletCardValue: { color: '#FFF', fontSize: 40, fontWeight: '800', marginBottom: 12 },
  transferInfoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  transferInfoText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  infoAlert: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, gap: 12 },
  infoAlertText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  bankInfoCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  bankHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  bankTitle: { fontSize: 16, fontWeight: '700' },
  bankDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bankDetailLabel: { fontSize: 13, fontWeight: '600' },
  bankDetailValue: { fontSize: 13, fontWeight: '700' },
  bankEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  bankEdit: { fontSize: 14, fontWeight: '700' },

  // History Modal
  historyStats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  historyStatBox: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  historyStatLabel: { fontSize: 12, fontWeight: '600' },
  historyStatValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  modalListTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  historyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center' },
  historyItemName: { fontSize: 15, fontWeight: '700' },
  historyItemSub: { fontSize: 12, marginTop: 2 },
  historyItemPrice: { fontSize: 16, fontWeight: '700' },

  // Forms
  formGroup: { gap: 8 },
  formLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  formInput: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  submitBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Settings
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  settingLabel: { fontSize: 16, fontWeight: '700' },
  settingSub: { fontSize: 12, marginTop: 2 },
  securityLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  securityLinkText: { fontSize: 16, fontWeight: '600' },
  modalSectionTitleSmall: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 8, marginBottom: 12 },

  // Mes Clients Modal
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  clientCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  avatarMini: { width: 44, height: 44, borderRadius: 22 },
  clientName: { fontSize: 15, fontWeight: '700' },
  clientSub: { fontSize: 12, marginTop: 2 },
  notesInput: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 15, textAlignVertical: 'top', minHeight: 150 },
  modalLabel: { fontSize: 14, fontWeight: '700' },
});
