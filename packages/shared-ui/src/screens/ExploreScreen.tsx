import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Image, ActivityIndicator } from 'react-native';
import {
  SpatialNavigationRoot,
  SpatialNavigationFocusableView,
  SpatialNavigationScrollView,
  DefaultFocus,
} from 'react-tv-space-navigation';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { CINEPILOT_CATALOG } from '../data/cinePilotCatalog';
import { CardData } from '../data/moviesData';
import TopNavigationBar from '../components/TopNavigationBar';

type ExploreScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'DrawerNavigator'>;

const CATEGORIES = ['All', 'Movies', 'TV Shows', 'Free', 'Action', 'Sci-Fi', 'Drama', 'Comedy'];
const PAGE_SIZE = 24;

// Portrait 2:3 Catalog Card (Poster fills container, Title beneath, Zero side space)
const CatalogCard = React.memo(
  ({
    item,
    isFocused,
  }: {
    item: CardData;
    isFocused: boolean;
  }) => {
    const [imgFailed, setImgFailed] = useState(false);
    const imageUri = item.posterUrl || item.headerImage || item.backdropUrl;

    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.posterBox, isFocused && styles.posterBoxFocused]}>
          {!imgFailed && imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.posterImage}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <View style={styles.cardFallback}>
              <Text style={styles.cardFallbackIcon}>🎬</Text>
              <Text style={styles.cardFallbackTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardFallbackMeta}>
                {item.releaseYear || 2024} • {item.contentRating || '16+'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfoBeneath}>
          <Text style={[styles.cardTitleBeneath, isFocused && styles.cardTitleFocused]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.cardMetaRowBeneath}>
            <Text style={styles.cardMetaYear}>{item.releaseYear || 2024}</Text>
            <Text style={styles.cardMetaDot}>•</Text>
            <Text style={styles.cardMetaGenre} numberOfLines={1}>
              {item.genres && item.genres[0] ? item.genres[0] : item.category || 'Feature'}
            </Text>
            {Boolean(item.contentRating) && (
              <>
                <Text style={styles.cardMetaDot}>•</Text>
                <View style={styles.cardRatingBadge}>
                  <Text style={styles.cardRatingBadgeText}>{item.contentRating}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }
);

export default function ExploreScreen() {
  const navigation = useNavigation<ExploreScreenNavProp>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();

  const initialCat = route.params?.initialCategory || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (route.params?.initialCategory) {
      setSelectedCategory(route.params.initialCategory);
      setVisibleCount(PAGE_SIZE);
    }
  }, [route.params?.initialCategory]);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const filteredMovies = useMemo(() => {
    return CINEPILOT_CATALOG.filter((item) => {
      let matchCat = true;
      if (selectedCategory === 'Free') {
        matchCat = item.rating ? item.rating >= 4.3 : true;
      } else if (selectedCategory !== 'All') {
        matchCat =
          item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          Boolean(item.genres && item.genres.some((g) => g.toLowerCase() === selectedCategory.toLowerCase()));
      }

      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const displayedMovies = useMemo(() => {
    return filteredMovies.slice(0, visibleCount);
  }, [filteredMovies, visibleCount]);

  const hasMore = visibleCount < filteredMovies.length;

  const loadMoreTitles = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredMovies.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore, filteredMovies.length]);

  const navigateToDetails = useCallback(
    (item: CardData) => {
      navigation.navigate('Details', {
        id: item.id,
        title: item.title,
        description: item.description,
        headerImage: item.backdropUrl || item.headerImage || item.posterUrl,
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
        <TopNavigationBar
          activeRoute={
            selectedCategory === 'Movies'
              ? 'Movies'
              : selectedCategory === 'TV Shows'
              ? 'TV Shows'
              : selectedCategory === 'Free'
              ? 'Free to Watch'
              : 'Movies'
          }
        />

        <SpatialNavigationScrollView
          useNativeScroll={true}
          offsetFromStart={20}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {selectedCategory === 'Movies'
                ? 'Movies Catalog'
                : selectedCategory === 'TV Shows'
                ? 'TV Shows & Series'
                : selectedCategory === 'Free'
                ? 'Free to Watch'
                : 'Browse Complete Catalog'}
            </Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title, genre, actor, or keyword..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searchQuery.length > 0 && (
                <Text
                  style={styles.clearSearchBtn}
                  onPress={() => handleSearchChange('')}
                >
                  ✕
                </Text>
              )}
            </View>
          </View>

          {/* Filter Categories */}
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <SpatialNavigationFocusableView
                  key={cat}
                  onSelect={() => handleCategorySelect(cat)}
                >
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View
                      style={[
                        styles.catPill,
                        isSelected && styles.catPillSelected,
                        focused && styles.catPillFocused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          isSelected && styles.catPillTextSelected,
                          focused && styles.catPillTextFocused,
                        ]}
                      >
                        {cat === 'Free' ? 'Free to Watch' : cat}
                      </Text>
                    </View>
                  )}
                </SpatialNavigationFocusableView>
              );
            })}
          </View>

          {/* Results Summary Status */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              Showing {displayedMovies.length} of {filteredMovies.length} {filteredMovies.length === 1 ? 'title' : 'titles'}
            </Text>
            {hasMore && (
              <Text style={styles.moreAvailableText}>
                • {filteredMovies.length - displayedMovies.length} more available
              </Text>
            )}
          </View>

          {/* Empty State */}
          {filteredMovies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No titles found</Text>
              <Text style={styles.emptySubtitle}>
                We couldn't find any titles matching "{searchQuery}" in {selectedCategory}.
              </Text>
              <SpatialNavigationFocusableView
                onSelect={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                {({ isFocused: focused }: { isFocused: boolean }) => (
                  <View style={[styles.resetButton, focused && styles.resetButtonFocused]}>
                    <Text style={styles.resetButtonText}>Reset Search & Filters</Text>
                  </View>
                )}
              </SpatialNavigationFocusableView>
            </View>
          ) : (
            <>
              {/* Responsive Portrait Grid (2:3 Ratio) */}
              <View style={styles.gridContainer}>
                {displayedMovies.map((item) => (
                  <SpatialNavigationFocusableView
                    key={item.id}
                    onSelect={() => navigateToDetails(item)}
                  >
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <CatalogCard
                        item={item}
                        isFocused={focused}
                      />
                    )}
                  </SpatialNavigationFocusableView>
                ))}
              </View>

              {/* Pagination / Load More Section */}
              <View style={styles.paginationSection}>
                {hasMore ? (
                  <SpatialNavigationFocusableView onSelect={loadMoreTitles}>
                    {({ isFocused: focused }: { isFocused: boolean }) => (
                      <View style={[styles.loadMoreButton, focused && styles.loadMoreButtonFocused]}>
                        {isLoadingMore ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color="#00A8E1" />
                            <Text style={styles.loadMoreText}>Loading more titles...</Text>
                          </View>
                        ) : (
                          <Text style={[styles.loadMoreText, focused && styles.loadMoreTextFocused]}>
                            ▼ Load More Titles ({filteredMovies.length - displayedMovies.length} remaining)
                          </Text>
                        )}
                      </View>
                    )}
                  </SpatialNavigationFocusableView>
                ) : (
                  <View style={styles.endOfCatalog}>
                    <Text style={styles.endOfCatalogText}>
                      ✓ All {filteredMovies.length} titles loaded
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </SpatialNavigationScrollView>
      </View>
    </SpatialNavigationRoot>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040714',
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 64, // Perfectly aligns with TopNav
    paddingTop: 24,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    maxWidth: 600,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  clearSearchBtn: {
    color: '#94A3B8',
    fontSize: 16,
    padding: 6,
    fontWeight: 'bold',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  catPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  catPillSelected: {
    backgroundColor: 'rgba(0, 168, 225, 0.2)',
    borderColor: '#00A8E1',
  },
  catPillFocused: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  catPillText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  catPillTextSelected: {
    color: '#00A8E1',
    fontWeight: '800',
  },
  catPillTextFocused: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  resultsCount: {
    color: '#00A8E1',
    fontSize: 14,
    fontWeight: '700',
  },
  moreAvailableText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  // Responsive Portrait Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  cardWrapper: {
    width: 160,
  },
  posterBox: {
    width: 160,
    height: 240, // 2:3 portrait aspect ratio
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0E1626',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  posterBoxFocused: {
    borderColor: '#00A8E1',
    transform: [{ scale: 1.05 }],
    shadowColor: '#00A8E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    zIndex: 10,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  cardFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0E1626',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardFallbackIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  cardFallbackTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardFallbackMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  cardInfoBeneath: {
    width: 160,
    paddingTop: 8,
  },
  cardTitleBeneath: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardTitleFocused: {
    color: '#00A8E1',
  },
  cardMetaRowBeneath: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardMetaYear: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardMetaDot: {
    color: '#475569',
    fontSize: 10,
  },
  cardMetaGenre: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 65,
  },
  cardRatingBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#475569',
  },
  cardRatingBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  paginationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 20,
  },
  loadMoreButton: {
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#00A8E1',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  loadMoreButtonFocused: {
    backgroundColor: '#00A8E1',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadMoreText: {
    color: '#00A8E1',
    fontSize: 15,
    fontWeight: '700',
  },
  loadMoreTextFocused: {
    color: '#040714',
  },
  endOfCatalog: {
    paddingVertical: 12,
  },
  endOfCatalogText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 450,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#0E1626',
    borderWidth: 1.5,
    borderColor: '#00A8E1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetButtonFocused: {
    backgroundColor: '#00A8E1',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
