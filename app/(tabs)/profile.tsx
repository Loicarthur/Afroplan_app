/**
 * Page Profil AfroPlan - Design z6/z7
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

/* ---------------- MOCK DATA ---------------- */
const USER_DATA = {
  name: 'Marie Dupont',
  email: 'marie.dupont@email.com',
  location: 'Paris, France',
  avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
  stats: {
    reservations: 12,
    avis: 8,
    salons: 5,
  },
};

const RECENT_BOOKINGS = [
  { id: '1', salon: 'Bella Coiffure', service: 'Box Braids', date: '15 Jan 2026', status: 'Terminé', statusColor: '#22C55E' },
  { id: '2', salon: 'Afro Style Studio', service: 'Twists', date: '22 Dec 2025', status: 'Terminé', statusColor: '#22C55E' },
];

const MENU_ITEMS = [
  { id: 'edit', icon: 'person-outline', label: 'Modifier le profil', color: '#8B5CF6' },
  { id: 'addresses', icon: 'location-outline', label: 'Adresses sauvegardées', color: '#F97316' },
  { id: 'bookings', icon: 'calendar-outline', label: 'Mes réservations', color: '#3B82F6' },
  { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', color: '#EC4899' },
  { id: 'settings', icon: 'settings-outline', label: 'Paramètres', color: '#8B5CF6' },
  { id: 'help', icon: 'help-circle-outline', label: 'Aide & Support', color: '#6B7280' },
];

// Mock profile pour tester toutes les rubriques
const profile = {
  full_name: 'Marie Dupont',
  email: 'marie.dupont@email.com',
  role: 'coiffeur',
};

/* ---------------- COMPONENT ---------------- */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signOut } = useAuth();

  const handleMenuPress = (id: string) => Alert.alert('Info', 'Fonctionnalité à venir');
  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: async () => await signOut() },
      ]
    );
  };
  const handleSeeAllBookings = () => Alert.alert('Info', 'Fonctionnalité à venir');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: USER_DATA.avatar }} style={styles.avatar} contentFit="cover" />
            </View>
            <Text style={styles.userName}>{USER_DATA.name}</Text>
            <Text style={styles.userEmail}>{USER_DATA.email}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{USER_DATA.location}</Text>
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <Stat label="Réservations" value={USER_DATA.stats.reservations} icon="calendar" />
            <Stat label="Avis donnés" value={USER_DATA.stats.avis} icon="star" />
            <Stat label="Salons suivis" value={USER_DATA.stats.salons} icon="people" />
          </View>
        </LinearGradient>

        {/* RESERVATIONS RECENTES */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Réservations récentes</Text>
            <TouchableOpacity onPress={handleSeeAllBookings}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          {RECENT_BOOKINGS.map(b => (
            <View key={b.id} style={[styles.bookingCard, { backgroundColor: colors.card }]}>
              <View>
                <Text style={[styles.bookingSalon, { color: colors.text }]}>{b.salon}</Text>
                <Text style={{ color: colors.textSecondary }}>{b.service} - {b.date}</Text>
              </View>
              <Text style={{ color: b.statusColor }}>{b.status}</Text>
            </View>
          ))}
        </View>

        {/* MODE COIFFEUR */}
        {profile?.role === 'coiffeur' && (
          <View style={styles.switchSection}>
            <TouchableOpacity style={[styles.switchButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/(coiffeur)')}>
              <Ionicons name="storefront" size={24} color="#FFF" />
              <View style={styles.switchContent}>
                <Text style={styles.switchTitle}>Espace Coiffeur</Text>
                <Text style={styles.switchSubtitle}>Gérer votre salon et vos réservations</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* MENUS */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Compte</Text>
          {['Modifier le profil', 'Notifications', 'Sécurité'].map((title, i) => (
            <MenuItem key={i} icon={i===0?'person-outline':i===1?'notifications-outline':'lock-closed-outline'} title={title} onPress={handleMenuPress} />
          ))}
        </View>
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Préférences</Text>
          {['Langue', 'Thème', 'Localisation'].map((title, i) => (
            <MenuItem key={i} icon={i===0?'globe-outline':i===1?'moon-outline':'location-outline'} title={title} onPress={handleMenuPress} />
          ))}
        </View>

        {/* MENU ITEMS GENERAUX */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity key={item.id} style={[styles.menuItem, { backgroundColor: colors.card }, Shadows.sm]} onPress={() => handleMenuPress(item.id)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color+'20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* DECONNEXION */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={[styles.signOutButton, { borderColor: colors.border }]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.textMuted }]}>© 2026 AfroPlan</Text>
        </View>

        <View style={{ height: 100 }} />

      </ScrollView>
    </View>
  );
}

/* ---------- SMALL COMPONENTS ---------- */
function Stat({ label, value, icon }: any) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color="#8B5CF6" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, title, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, Shadows.sm]} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: '#ccc20' }]}>
        <Ionicons name={icon} size={20} color="#333" />
      </View>
      <Text style={styles.menuLabel}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop:50, paddingBottom:20, borderBottomLeftRadius:24, borderBottomRightRadius:24 },
  profileSection: { alignItems:'center', paddingHorizontal:20, marginBottom:20 },
  avatarContainer:{ width:80, height:80, borderRadius:40, borderWidth:3, borderColor:'rgba(255,255,255,0.3)', overflow:'hidden', marginBottom:12 },
  avatar:{ width:'100%', height:'100%' },
  userName:{ fontSize:22, fontWeight:'700', color:'#FFF', marginBottom:4 },
  userEmail:{ fontSize:14, color:'rgba(255,255,255,0.8)', marginBottom:4 },
  locationRow:{ flexDirection:'row', alignItems:'center' },
  locationText:{ marginLeft:4, color:'rgba(255,255,255,0.8)' },
  statsContainer:{ flexDirection:'row', justifyContent:'space-around', paddingHorizontal:20 },
  statItem:{ alignItems:'center' },
  statIcon:{ width:40, height:40, borderRadius:20, backgroundColor:'#FFF', justifyContent:'center', alignItems:'center', marginBottom:6 },
  statValue:{ color:'#FFF', fontWeight:'700', fontSize:18 },
  statLabel:{ color:'rgba(255,255,255,0.8)', fontSize:11 },
  section:{ padding:20 },
  sectionHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  sectionTitle:{ fontSize:18, fontWeight:'700' },
  seeAll:{ fontSize:14, fontWeight:'500' },
  bookingCard:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderRadius:16, padding:16, marginBottom:10 },
  bookingSalon:{ fontSize:16, fontWeight:'600' },
  switchSection:{ paddingHorizontal:Spacing.md, marginBottom:Spacing.lg },
  switchButton:{ flexDirection:'row', alignItems:'center', padding:Spacing.md, borderRadius:BorderRadius.lg },
  switchContent:{ flex:1, marginLeft:Spacing.md },
  switchTitle:{ fontSize:FontSizes.md, fontWeight:'600', color:'#FFF' },
  switchSubtitle:{ fontSize:FontSizes.sm, marginTop:2, color:'rgba(255,255,255,0.8)' },
  menuSection:{ paddingHorizontal:Spacing.md, marginBottom:Spacing.lg },
  menuSectionTitle:{ fontSize:FontSizes.sm, fontWeight:'600' },
  menuItem:{ flexDirection:'row', alignItems:'center', borderRadius:16, padding:16, marginBottom:10 },
  menuIcon:{ width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center', marginRight:12 },
  menuLabel:{ flex:1, fontSize:15, fontWeight:'500' },
  signOutButton:{ flexDirection:'row', alignItems:'center', justifyContent:'center', borderRadius:16, padding:16, borderWidth:1, gap:8 },
  signOutText:{ fontSize:15, fontWeight:'600', color:'#EF4444' },
  appInfo:{ alignItems:'center', paddingVertical:24 },
  appVersion:{ fontSize:12 },
  copyright:{ fontSize:11 },
});
