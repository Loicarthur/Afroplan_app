import React from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sections = [
    {
      title: '1. Introduction',
      content:
        "Bienvenue sur AfroPlan. Nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et partageons vos informations lorsque vous utilisez notre application mobile AfroPlan (\"l'Application\").\n\nEn utilisant l'Application, vous acceptez les pratiques décrites dans cette politique.",
    },
    {
      title: '2. Données collectées',
      content:
        "Nous collectons les types de données suivants :\n\n" +
        "a) Données que vous nous fournissez :\n" +
        "- Informations de compte : nom, prénom, adresse e-mail, mot de passe\n" +
        "- Informations de profil : photo de profil, numéro de téléphone\n" +
        "- Données de réservation : salons visités, services réservés, dates et horaires\n" +
        "- Avis et commentaires que vous publiez\n" +
        "- Messages échangés via le chat intégré\n\n" +
        "b) Données collectées automatiquement :\n" +
        "- Données d'utilisation : pages consultées, fonctionnalités utilisées\n" +
        "- Informations sur l'appareil : type d'appareil, système d'exploitation, identifiant unique",
    },
    {
      title: '3. Utilisation des données',
      content:
        "Nous utilisons vos données pour :\n\n" +
        "- Fournir, maintenir et améliorer l'Application\n" +
        "- Gérer votre compte et vos réservations\n" +
        "- Traiter les paiements via nos partenaires de paiement sécurisé (Stripe)\n" +
        "- Vous envoyer des notifications liées à vos réservations\n" +
        "- Personnaliser votre expérience (recommandations de salons)\n" +
        "- Assurer la sécurité et prévenir la fraude\n" +
        "- Respecter nos obligations légales",
    },
    {
      title: '4. Partage des données',
      content:
        "Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :\n\n" +
        "- Les salons de coiffure : pour traiter vos réservations (nom, date, service demandé)\n" +
        "- Nos prestataires techniques : hébergement (Supabase), paiements (Stripe)\n" +
        "- Les autorités : si la loi l'exige\n\n" +
        "Tous nos partenaires sont tenus de protéger vos données conformément aux réglementations en vigueur.",
    },
    {
      title: '5. Stockage et sécurité',
      content:
        "Vos données sont stockées de manière sécurisée sur les serveurs de notre partenaire d'hébergement (Supabase). Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou altération :\n\n" +
        "- Chiffrement des données en transit (HTTPS/TLS)\n" +
        "- Chiffrement des mots de passe\n" +
        "- Contrôle d'accès strict aux bases de données\n" +
        "- Sauvegardes régulières",
    },
    {
      title: '6. Vos droits',
      content:
        "Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :\n\n" +
        "- Droit d'accès : consulter vos données personnelles\n" +
        "- Droit de rectification : corriger vos données inexactes\n" +
        "- Droit de suppression : demander la suppression de votre compte et de vos données\n" +
        "- Droit à la portabilité : recevoir vos données dans un format structuré\n" +
        "- Droit d'opposition : vous opposer au traitement de vos données\n\n" +
        "Pour exercer ces droits, contactez-nous à : support@afroplan.com",
    },
    {
      title: '7. Conservation des données',
      content:
        "Nous conservons vos données personnelles aussi longtemps que votre compte est actif. Si vous supprimez votre compte, vos données personnelles seront supprimées dans un délai de 30 jours, sauf obligation légale de conservation.",
    },
    {
      title: '8. Cookies et technologies similaires',
      content:
        "L'Application peut utiliser des technologies de stockage local (AsyncStorage) pour améliorer votre expérience. Ces données restent sur votre appareil et ne sont pas partagées avec des tiers.",
    },
    {
      title: '9. Protection des mineurs',
      content:
        "L'Application n'est pas destinée aux enfants de moins de 16 ans. Nous ne collectons pas sciemment de données de mineurs. Si vous êtes parent et pensez que votre enfant nous a fourni des données, contactez-nous à support@afroplan.com.",
    },
    {
      title: '10. Modifications',
      content:
        "Nous pouvons mettre à jour cette politique de confidentialité. Toute modification sera publiée dans l'Application. Nous vous informerons des changements importants par notification.",
    },
    {
      title: '11. Contact',
      content:
        "Pour toute question relative à cette politique de confidentialité :\n\n" +
        "AfroPlan\n" +
        "E-mail : support@afroplan.com\n\n" +
        "Dernière mise à jour : février 2026",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Politique de confidentialité
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Votre vie privée est importante pour nous. Cette politique explique comment AfroPlan
          collecte, utilise et protège vos données personnelles.
        </Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
});
