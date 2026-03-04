import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

interface FeedbackListModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackListModal({ visible, onClose }: FeedbackListModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_feedbacks')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (!error) setFeedbacks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchFeedbacks();
  }, [visible]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.badge, item.type === 'bug' ? { backgroundColor: '#EF4444' } : { backgroundColor: Colors.light.primary }]}>
          {item.type.toUpperCase()}
        </Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
      <Text style={[styles.user, { color: colors.textSecondary }]}>
        De: {item.user?.full_name || 'Anonyme'} ({item.user?.email || 'N/A'})
      </Text>
      <Text style={[styles.device, { color: colors.textMuted }]}>Appareil: {item.device_info}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Retours Testeurs</Text>
          <TouchableOpacity onPress={fetchFeedbacks}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={feedbacks}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>Aucun retour pour le moment.</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  list: { padding: 20 },
  card: { padding: 16, borderRadius: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, color: '#FFF', fontSize: 10, fontWeight: '800' },
  date: { fontSize: 12 },
  content: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  user: { fontSize: 13, fontWeight: '600' },
  device: { fontSize: 11, marginTop: 4 },
});
