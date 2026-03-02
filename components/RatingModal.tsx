import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from './ui';
import { reviewService } from '@/services/review.service';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  salonId: string;
  salonName: string;
  onSuccess?: () => void;
}

export default function RatingModal({ visible, onClose, bookingId, salonId, salonName, onSuccess }: RatingModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Attention', 'Veuillez sélectionner une note avant de valider.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.createReview({
        booking_id: bookingId,
        salon_id: salonId,
        rating,
        comment: comment.trim(),
      });
      
      Alert.alert('Merci !', 'Votre avis a bien été enregistré. Cela aide beaucoup la communauté AfroPlan.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer votre avis pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="star" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Votre avis compte ! ✨</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {"Comment s'est passée votre prestation chez "}
              <Text style={{ fontWeight: "700", color: colors.text }}>{salonName}</Text> ?
            </Text>
          </View>

          {/* Stars */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={44}
                  color={star <= rating ? "#FFB800" : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Un commentaire (optionnel)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              placeholder="Qu'avez-vous aimé (accueil, technique, ambiance...) ?"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <Button
            title="Envoyer ma note"
            onPress={handleSubmit}
            loading={isSubmitting}
            fullWidth
            style={{ marginTop: 10 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 30,
    padding: 24,
    ...Shadows.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
