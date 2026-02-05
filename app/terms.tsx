import React from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sections = [
    {
      title: '1. Objet',
      content:
        "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application mobile AfroPlan (\"l'Application\"). En utilisant l'Application, vous acceptez sans réserve les présentes CGU.",
    },
    {
      title: "2. Description de l'Application",
      content:
        "AfroPlan est une plateforme de mise en relation entre des utilisateurs recherchant des services de coiffure afro et des salons de coiffure professionnels. L'Application permet de :\n\n" +
        "- Découvrir des salons de coiffure spécialisés\n" +
        "- Réserver des prestations en ligne\n" +
        "- Consulter les avis et évaluations\n" +
        "- Communiquer avec les salons via le chat intégré\n" +
        "- Gérer ses réservations et favoris",
    },
    {
      title: '3. Inscription et compte',
      content:
        "Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous vous engagez à :\n\n" +
        "- Fournir des informations exactes et à jour\n" +
        "- Maintenir la confidentialité de vos identifiants\n" +
        "- Ne pas créer de compte avec une fausse identité\n" +
        "- Nous informer de toute utilisation non autorisée de votre compte\n\n" +
        "Vous êtes responsable de toute activité effectuée depuis votre compte.",
    },
    {
      title: "4. Utilisation de l'Application",
      content:
        "Vous vous engagez à utiliser l'Application de manière conforme à la loi et aux présentes CGU. Il est interdit de :\n\n" +
        "- Publier des contenus illicites, diffamatoires ou offensants\n" +
        "- Usurper l'identité d'un tiers\n" +
        "- Perturber le fonctionnement de l'Application\n" +
        "- Collecter les données d'autres utilisateurs\n" +
        "- Utiliser l'Application à des fins commerciales non autorisées",
    },
    {
      title: '5. Réservations et paiements',
      content:
        "Les réservations effectuées via l'Application constituent un engagement entre vous et le salon. Les conditions d'annulation sont définies par chaque salon.\n\n" +
        "Les paiements sont traités de manière sécurisée par notre partenaire Stripe. AfroPlan ne stocke aucune donnée bancaire.\n\n" +
        "AfroPlan agit en tant qu'intermédiaire et n'est pas partie au contrat entre l'utilisateur et le salon.",
    },
    {
      title: '6. Avis et commentaires',
      content:
        "Vous pouvez publier des avis sur les salons visités. Ces avis doivent :\n\n" +
        "- Refléter une expérience réelle\n" +
        "- Rester respectueux et constructifs\n" +
        "- Ne pas contenir de propos discriminatoires ou injurieux\n\n" +
        "AfroPlan se réserve le droit de modérer ou supprimer tout contenu contraire aux présentes CGU.",
    },
    {
      title: '7. Propriété intellectuelle',
      content:
        "L'Application, son contenu et son design sont protégés par les droits de propriété intellectuelle. Toute reproduction, modification ou distribution sans autorisation est interdite.",
    },
    {
      title: '8. Responsabilité',
      content:
        "AfroPlan s'efforce de fournir un service fiable mais ne garantit pas l'absence d'interruptions ou d'erreurs. AfroPlan ne saurait être tenu responsable :\n\n" +
        "- De la qualité des prestations fournies par les salons\n" +
        "- Des litiges entre utilisateurs et salons\n" +
        "- Des dommages indirects liés à l'utilisation de l'Application",
    },
    {
      title: '9. Modification des CGU',
      content:
        "AfroPlan se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication. Il vous appartient de consulter régulièrement les CGU.",
    },
    {
      title: '10. Droit applicable',
      content:
        "Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.\n\n" +
        "Dernière mise à jour : février 2026",
    },
    {
      title: '11. Contact',
      content: "Pour toute question :\n\nAfroPlan\nE-mail : support@afroplan.com",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Conditions d'utilisation
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Veuillez lire attentivement les conditions suivantes avant d'utiliser AfroPlan.
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
