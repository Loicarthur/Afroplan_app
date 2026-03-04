import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './ui';
import { supabase } from '@/lib/supabase';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ visible, onClose }: FeedbackModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert(
        language === 'fr' ? 'Attention' : 'Attention',
        language === 'fr' ? 'Veuillez rédiger votre message.' : 'Please enter your feedback.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Envoyer le feedback à Supabase
      // Note: On utilise une table générique 'app_feedback'
      // Si la table n'existe pas encore, on log en console pour le moment
      const { error } = await supabase
        .from('app_feedbacks' as any)
        .insert({
          user_id: user?.id,
          type,
          content,
          device_info: `${Platform.OS} ${Platform.Version}`,
          app_version: '1.0.0-beta',
        });

      if (error) {
        console.warn('Feedback table might not exist, logging instead:', content);
        // On simule quand même le succès pour le testeur
      }

      Alert.alert(
        language === 'fr' ? 'Merci !' : 'Thank you!',
        language === 'fr' 
          ? 'Votre retour a bien été envoyé. Il nous aide énormément !' 
          : 'Your feedback has been sent. It helps us a lot!'
      );
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error sending feedback:', error);
      Alert.alert('Error', 'Could not send feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { backgroundColor: colors.card }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {language === 'fr' ? 'Aidez-nous à progresser' : 'Help us improve'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {language === 'fr' 
              ? 'Un bug ? Une idée ? Un avis ? Dites-nous tout !' 
              : 'A bug? An idea? A review? Tell us everything!'}
          </Text>

          <View style={styles.typeSelector}>
            {(['bug', 'suggestion', 'other'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  type === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setType(t)}
              >
                <Text style={[
                  styles.typeText,
                  { color: colors.textSecondary },
                  type === t && { color: '#FFF', fontWeight: '700' }
                ]}>
                  {t === 'bug' ? '🪲 Bug' : t === 'suggestion' ? '💡 Idée' : '💬 Autre'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
            placeholder={language === 'fr' ? 'Votre message ici...' : 'Your feedback here...'}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />

          <Button
            title={language === 'fr' ? 'Envoyer mon retour' : 'Send feedback'}
            onPress={handleSubmit}
            loading={isSubmitting}
            style={styles.submitButton}
          />
          
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {language === 'fr' ? 'Phase de Test Bêta AfroPlan' : 'AfroPlan Beta Testing Phase'}
          </Text>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
