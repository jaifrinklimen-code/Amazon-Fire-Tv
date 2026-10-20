import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationFocusableView,
  SpatialNavigationScrollView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { CINEPILOT_CATALOG } from '../data/cinePilotCatalog';
import { CardData } from '../data/moviesData';
import {
  MoodType,
  ViewingTimeType,
  LanguageFilterType,
  WatchMateFilters,
  filterWatchMateCatalog,
} from '../data/watchMateEngine';
import TopNavigationBar from '../components/TopNavigationBar';
import PlatformLinearGradient from '../components/PlatformLinearGradient';

type WatchMateNavProp = NativeStackNavigationProp<RootStackParamList, 'DrawerNavigator'>;

export default function WatchMateScreen() {
  const navigation = useNavigation<WatchMateNavProp>();
  const isFocused = useIsFocused();

  const [mood, setMood] = useState<MoodType>('thrilling');
  const [genre, setGenre] = useState<string>('all');
  const [language, setLanguage] = useState<LanguageFilterType>('all');
  const [time, setTime] = useState<ViewingTimeType>('all');

  const moods: { label: string; value: MoodType }[] = [
    { label: 'Thrilling', value: 'thrilling' },
    { label: 'Uplifting', value: 'uplifting' },
    { label: 'Relaxed', value: 'relaxed' },
    { label: 'Mind-Bending', value: 'mind_bending' },
  ];

  const genres = ['All', 'Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller'];

  const languages: { label: string; value: LanguageFilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'International', value: 'international' },
  ];

  const times: { label: string; value: ViewingTimeType }[] = [
    { label: 'Any', value: 'all' },
    { label: '< 45 min', value: 'quick' },
    { label: '1 - 2 hours', value: 'standard' },
    { label: '2+ hours', value: 'extended' },
  ];

  const recommendations = useMemo(() => {
    const filters: WatchMateFilters = {
      mood,
      selectedGenre: genre,
      language,
      viewingTime: time,
    };
    return filterWatchMateCatalog(CINEPILOT_CATALOG, filters);
  }, [mood, genre, language, time]);

  const navigateToDetails = useCallback(
    (item: CardData) => {
      navigation.navigate('Details', {
        id: item.id,
        title: item.title,
        description: item.description,
        headerImage: item.headerImage,
        movie: item.movie,
        category: item.category,
        genres: item.genres,
        releaseYear: item.releaseYear,
        rating: item.rating,
        ratingCount: item.ratingCount,
        contentRating: item.contentRating,
        duration: item.duration,
      });
    },
    [navigation],
  );

  return (
    <SpatialNavigationRoot isActive={isFocused}>
      <View style={styles.container}>
        <TopNavigationBar activeRoute="WatchMate AI" />

        <SpatialNavigationScrollView
          useNativeScroll={true}
          offsetFromStart={20}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>WatchMate AI Concierge</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>✨ On-Device Intelligence</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Tailor personalized movie and series recommendations based on your real-time mood and schedule.
            </Text>
          </View>

          {/* Mood Row */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Mood</Text>
            <View style={styles.filterGroup}>
              {moods.map((m, idx) => {
                const isSelected = mood === m.value;
                return (
                  <SpatialNavigationFocusableView key={m.value} onSelect={() => setMood(m.value)}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                          focused && styles.chipFocused,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                            focused && styles.chipTextFocused,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                );
              })}
            </View>
          </View>

          {/* Genre Row */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Genre</Text>
            <View style={styles.filterGroup}>
              {genres.map((g) => {
                const isSelected = genre.toLowerCase() === g.toLowerCase();
                return (
                  <SpatialNavigationFocusableView key={g} onSelect={() => setGenre(g)}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                          focused && styles.chipFocused,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                            focused && styles.chipTextFocused,
                          ]}
                        >
                          {g}
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                );
              })}
            </View>
          </View>

          {/* Language Row */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Language</Text>
            <View style={styles.filterGroup}>
              {languages.map((l) => {
                const isSelected = language === l.value;
                return (
                  <SpatialNavigationFocusableView key={l.value} onSelect={() => setLanguage(l.value)}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                          focused && styles.chipFocused,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                            focused && styles.chipTextFocused,
                          ]}
                        >
                          {l.label}
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                );
              })}
            </View>
          </View>

          {/* Time Available */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Viewing Time</Text>
            <View style={styles.filterGroup}>
              {times.map((t) => {
                const isSelected = time === t.value;
                return (
                  <SpatialNavigationFocusableView key={t.value} onSelect={() => setTime(t.value)}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                          focused && styles.chipFocused,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                            focused && styles.chipTextFocused,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                );
              })}
            </View>
          </View>

          {/* Recommendations Grid */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Recommended for You ({recommendations.length} {recommendations.length === 1 ? 'match' : 'matches'})
            </Text>
            <View style={styles.grid}>
              {recommendations.map((rec) => (
                <SpatialNavigationFocusableView key={rec.item.id} onSelect={() => navigateToDetails(rec.item)}>
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={[styles.recCard, focused && styles.recCardFocused]}>
                      <Image source={{ uri: rec.item.posterUrl || rec.item.headerImage || rec.item.backdropUrl }} style={styles.recImage} resizeMode="contain" />
                      <PlatformLinearGradient
                        colors={['transparent', 'rgba(4,7,20,0.6)', 'rgba(4,7,20,0.95)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.cardGradient}
                      />
                      <View style={styles.recInfo}>
                        <Text style={styles.recTitle} numberOfLines={1}>
                          {rec.item.title}
                        </Text>
                        <Text style={styles.recReason} numberOfLines={2}>
                          ✨ {rec.aiExplanation}
                        </Text>
                      </View>
                    </View>
                  )}
                </SpatialNavigationFocusableView>
              ))}
            </View>
          </View>
        </SpatialNavigationScrollView>
      </View>
    </SpatialNavigationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040714',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 48,
    paddingTop: 24,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiBadge: {
    backgroundColor: 'rgba(0, 168, 225, 0.15)',
    borderColor: '#00A8E1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: '#00A8E1',
    fontSize: 12,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    maxWidth: 700,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    width: 130,
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#070D1A',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  chipSelected: {
    backgroundColor: 'rgba(0, 168, 225, 0.2)',
    borderColor: '#00A8E1',
  },
  chipFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#00A8E1',
    fontWeight: '800',
  },
  chipTextFocused: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  recCard: {
    width: 260,
    height: 156,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#070D1A',
    position: 'relative',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  recCardFocused: {
    borderColor: '#00A8E1',
    transform: [{ scale: 1.06 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: 10,
  },
  recImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  recInfo: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 8,
    zIndex: 5,
  },
  recTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  recReason: {
    color: '#00A8E1',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
});
