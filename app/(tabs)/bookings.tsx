/**
 * Galerie de Styles AfroPlan - Design z2/z3
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

// Categories de styles
const STYLE_CATEGORIES = [
  { id: 'all', name: 'Tous' },
  { id: 'braids', name: 'Braids' },
  { id: 'twists', name: 'Twists' },
  { id: 'locs', name: 'Locs' },
  { id: 'natural', name: 'Natural' },
  { id: 'weave', name: 'Weave' },
];

// Donnees de test pour les styles
const STYLES_DATA = [
  {
    id: '1',
    name: 'Box Braids Longues',
    category: 'braids',
    duration: '4-6h',
    price: '150-200€',
    likes: 342,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    badgeColor: '#8B5CF6',
  },
  {
    id: '2',
    name: 'Natural Afro',
    category: 'natural',
    duration: '2-3h',
    price: '80-120€',
    likes: 289,
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400',
    badgeColor: '#F97316',
  },
  {
    id: '3',
    name: 'Passion Twists',
    category: 'twists',
    duration: '3-5h',
    price: '120-180€',
    likes: 256,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    badgeColor: '#EC4899',
  },
  {
    id: '4',
    name: 'Cornrows Design',
    category: 'braids',
    duration: '2-4h',
    price: '90-150€',
    likes: 198,
    image: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400',
    badgeColor: '#8B5CF6',
  },
  {
    id: '5',
    name: 'Faux Locs',
    category: 'locs',
    duration: '5-7h',
    price: '180-250€',
    likes: 312,
    image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=400',
    badgeColor: '#22C55E',
  },
  {
    id: '6',
    name: 'Fulani Braids',
    category: 'braids',
    duration: '3-5h',
    price: '130-180€',
    likes: 267,
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400',
    badgeColor: '#8B5CF6',
  },
];

export default function StylesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredStyles = STYLES_DATA.filter((style) => {
    const matchesCategory = selectedCategory === 'all' || style.category === selectedCategory;
    const matchesSearch = style.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      braids: 'Braids',
      natural: 'Natural',
      twists: 'Twists',
      locs: 'Locs',
      weave: 'Weave',
    };
    return labels[category] || category;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Galerie de Styles</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un style..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="options" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {STYLE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === category.id ? colors.primary : colors.background,
                  borderColor: selectedCategory === category.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category.id ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBar, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      {/* Styles Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      >
        <View style={styles.grid}>
          {filteredStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[styles.styleCard, { backgroundColor: colors.card }, Shadows.md]}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: style.image }}
                  style={styles.styleImage}
                  contentFit="cover"
                />
                {/* Save button */}
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]}>
                  <Ionicons name="bookmark-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Like button */}
                <TouchableOpacity style={styles.likeButton}>
                  <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Category badge */}
                <View style={[styles.categoryBadge, { backgroundColor: style.badgeColor }]}>
                  <Text style={styles.badgeText}>{getCategoryLabel(style.category)}</Text>
                </View>
              </View>
              <View style={styles.styleInfo}>
                <Text style={[styles.styleName, { color: colors.text }]} numberOfLines={1}>
                  {style.name}
                </Text>
                <View style={styles.styleDetails}>
                  <Text style={[styles.duration, { color: colors.textSecondary }]}>
                    {style.duration}
                  </Text>
                  <Text style={[styles.price, { color: colors.primary }]}>
                    {style.price}
                  </Text>
                </View>
                <View style={styles.likesContainer}>
                  <Ionicons name="heart" size={12} color="#EF4444" />
                  <Text style={[styles.likesCount, { color: colors.textMuted }]}>
                    {style.likes}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesWrapper: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
  },
  progressBar: {
    width: '40%',
    height: '100%',
    borderRadius: 2,
  },
  gridContainer: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  styleCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  styleImage: {
    width: '100%',
    height: 180,
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  styleInfo: {
    padding: 12,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  styleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  duration: {
    fontSize: 12,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCount: {
    fontSize: 11,
  },
});
