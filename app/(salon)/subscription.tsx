/**
 * Page d'abonnement Salon - AfroPlan
 * Choix du plan pour réduire les commissions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/services/payment.service';

export default function SubscriptionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro');
  const [currentPlan] = useState<SubscriptionPlan>('free');

  const plans = Object.values(SUBSCRIPTION_PLANS);

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === currentPlan) return;
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    const plan = SUBSCRIPTION_PLANS[selectedPlan];
    Alert.alert(
      'Confirmer l\'abonnement',
      `Vous allez souscrire au plan ${plan.name} pour ${plan.price}€/mois.\n\nVotre commission passera de 15% à ${plan.commission}%.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            Alert.alert(
              'Abonnement activé !',
              `Bienvenue dans le plan ${plan.name}. Votre commission est maintenant de ${plan.commission}%.`,
              [{ text: 'Super !', onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  };

  const calculateSavings = (planId: SubscriptionPlan) => {
    const freePlan = SUBSCRIPTION_PLANS.free;
    const plan = SUBSCRIPTION_PLANS[planId];

    // Simulation pour 5000€ de CA mensuel
    const monthlyRevenue = 500000; // 5000€ en centimes
    const freeCommission = monthlyRevenue * (freePlan.commission / 100);
    const planCommission = monthlyRevenue * (plan.commission / 100);
    const savings = (freeCommission - planCommission) / 100;
    const netSavings = savings - plan.price;

    return { savings: savings.toFixed(0), netSavings: netSavings.toFixed(0) };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choisir un plan</Text>
        <Text style={styles.headerSubtitle}>
          Réduisez vos commissions et boostez votre salon
        </Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Simulation d'économies */}
        <View style={[styles.savingsCard, { backgroundColor: colors.card }, Shadows.md]}>
          <Ionicons name="calculator-outline" size={24} color={colors.primary} />
          <View style={styles.savingsInfo}>
            <Text style={[styles.savingsTitle, { color: colors.text }]}>
              Simulez vos économies
            </Text>
            <Text style={[styles.savingsSubtitle, { color: colors.textSecondary }]}>
              Pour 5 000€ de CA mensuel
            </Text>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentPlan === plan.id;
            const { savings, netSavings } = calculateSavings(plan.id as SubscriptionPlan);
            const isPro = plan.id === 'pro';

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: colors.card },
                  isSelected && styles.planCardSelected,
                  isSelected && { borderColor: colors.primary },
                  isPro && !isSelected && styles.planCardPopular,
                  Shadows.md,
                ]}
                onPress={() => handleSelectPlan(plan.id as SubscriptionPlan)}
                disabled={isCurrent}
              >
                {isPro && !isCurrent && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Populaire</Text>
                  </View>
                )}

                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.currentText}>Plan actuel</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: colors.text }]}>
                    {plan.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    {plan.price > 0 ? (
                      <>
                        <Text style={[styles.planPrice, { color: colors.text }]}>
                          {plan.price}€
                        </Text>
                        <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>
                          /mois
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.planPrice, { color: colors.text }]}>
                        Gratuit
                      </Text>
                    )}
                  </View>
                </View>

                {/* Commission */}
                <View style={styles.commissionContainer}>
                  <View
                    style={[
                      styles.commissionBadge,
                      {
                        backgroundColor:
                          plan.commission <= 8
                            ? '#DCFCE7'
                            : plan.commission <= 10
                            ? '#FEF3C7'
                            : '#F3F4F6',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.commissionText,
                        {
                          color:
                            plan.commission <= 8
                              ? '#166534'
                              : plan.commission <= 10
                              ? '#92400E'
                              : '#6B7280',
                        },
                      ]}
                    >
                      {plan.commission}% de commission
                    </Text>
                  </View>
                </View>

                {/* Économies */}
                {plan.price > 0 && (
                  <View style={styles.savingsContainer}>
                    <Ionicons name="trending-down" size={16} color="#22C55E" />
                    <Text style={[styles.savingsAmount, { color: '#22C55E' }]}>
                      Économisez {savings}€/mois
                    </Text>
                    {parseInt(netSavings) > 0 && (
                      <Text style={[styles.netSavings, { color: colors.textSecondary }]}>
                        (net: +{netSavings}€)
                      </Text>
                    )}
                  </View>
                )}

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={isSelected ? colors.primary : '#22C55E'}
                      />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Sélection */}
                {!isCurrent && (
                  <View
                    style={[
                      styles.selectIndicator,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={[styles.faqTitle, { color: colors.text }]}>
            Questions fréquentes
          </Text>

          <View style={[styles.faqItem, { backgroundColor: colors.card }]}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <View style={styles.faqContent}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                Puis-je changer de plan ?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                Oui, vous pouvez upgrader ou downgrader à tout moment. Les changements prennent effet immédiatement.
              </Text>
            </View>
          </View>

          <View style={[styles.faqItem, { backgroundColor: colors.card }]}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <View style={styles.faqContent}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                Comment fonctionne la commission ?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                La commission est prélevée automatiquement sur chaque paiement client. Le reste est versé sur votre compte.
              </Text>
            </View>
          </View>

          <View style={[styles.faqItem, { backgroundColor: colors.card }]}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <View style={styles.faqContent}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>
                Engagement minimum ?
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                Aucun engagement. Vous pouvez annuler votre abonnement à tout moment sans frais.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bouton d'action */}
      {selectedPlan !== currentPlan && (
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.subscribeGradient}
            >
              <Text style={styles.subscribeText}>
                {SUBSCRIPTION_PLANS[selectedPlan].price > 0
                  ? `S'abonner pour ${SUBSCRIPTION_PLANS[selectedPlan].price}€/mois`
                  : 'Passer au plan gratuit'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  savingsSubtitle: {
    fontSize: 13,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 2,
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 14,
    marginLeft: 2,
  },
  commissionContainer: {
    marginBottom: 12,
  },
  commissionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  commissionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  savingsAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  netSavings: {
    fontSize: 12,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  selectIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqSection: {
    padding: 20,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  faqItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  subscribeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
