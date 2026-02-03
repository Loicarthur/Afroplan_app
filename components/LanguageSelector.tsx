/**
 * Language Selector Component - AfroPlan
 * Permet de choisir la langue de l'application
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { language, setLanguage, languages, t } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = languages.find(l => l.code === language);

  const handleSelectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    setModalVisible(false);
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flagEmoji}>{currentLanguage?.flag}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[styles.dropdownContainer, { backgroundColor: colors.card }]}
            >
              {languages.map((lang, index) => (
                <Animated.View
                  key={lang.code}
                  entering={FadeInUp.delay(index * 50).duration(200)}
                >
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      language === lang.code && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={styles.dropdownFlag}>{lang.flag}</Text>
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {lang.name}
                    </Text>
                    {language === lang.code && (
                      <Ionicons name="checkmark" size={18} color="#22C55E" />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.fullButton, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.fullButtonContent}>
          <Ionicons name="language" size={22} color={colors.text} />
          <View style={styles.fullButtonText}>
            <Text style={[styles.fullButtonLabel, { color: colors.text }]}>
              {t('profile.language')}
            </Text>
            <Text style={[styles.fullButtonValue, { color: colors.textSecondary }]}>
              {currentLanguage?.flag} {currentLanguage?.name}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <Animated.View
            entering={FadeIn.duration(300)}
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('profile.language')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Language options */}
            <View style={styles.languageList}>
              {languages.map((lang, index) => (
                <Animated.View
                  key={lang.code}
                  entering={FadeInUp.delay(index * 80).duration(300)}
                >
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      { backgroundColor: colors.card },
                      language === lang.code && styles.languageOptionSelected,
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[styles.languageName, { color: colors.text }]}>
                      {lang.name}
                    </Text>
                    {language === lang.code && (
                      <View style={styles.checkmarkCircle}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact mode
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  flagEmoji: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dropdownContainer: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(25, 25, 25, 0.05)',
  },
  dropdownFlag: {
    fontSize: 24,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  // Full mode
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  fullButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fullButtonText: {},
  fullButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  fullButtonValue: {
    fontSize: 13,
    marginTop: 2,
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  languageList: {
    gap: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    gap: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: '#191919',
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
