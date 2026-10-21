import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { cinePilotStore } from '../data/cinePilotStore';
import TopNavigationBar from '../components/TopNavigationBar';

type MyListNavProp = NativeStackNavigationProp<RootStackParamList, 'DrawerNavigator'>;

export default function MyListScreen() {
  const navigation = useNavigation<MyListNavProp>();
  const isFocused = useIsFocused();
  const [watchlistIds, setWatchlistIds] = useState<(string | number)[]>([]);

  useEffect(() => {
    if (isFocused) {
      setWatchlistIds(cinePilotStore.getWatchlist());
    }
  }, [isFocused]);

  const savedMovies = useMemo(() => {
    return CINEPILOT_CATALOG.filter((item) => watchlistIds.includes(item.id));
  }, [watchlistIds]);

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
        <TopNavigationBar activeRoute="My List" />

        <SpatialNavigationScrollView
          useNativeScroll={true}
          offsetFromStart={20}
          style={styles.gridScroll}
          contentContainerStyle={styles.gridContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Watchlist</Text>
            <Text style={styles.headerCount}>{savedMovies.length} saved titles</Text>
          </View>

          {savedMovies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📑</Text>
              <Text style={styles.emptyTitle}>Your Watchlist is empty</Text>
              <Text style={styles.emptySubtitle}>
                Add movies and TV series to your list while browsing to easily find them later.
              </Text>
              <SpatialNavigationFocusableView onSelect={() => (navigation as any).navigate('Explore')}>
                {({ isFocused: focused }: { isFocused: boolean }) => (
                  <View style={[styles.exploreBtn, focused && styles.exploreBtnFocused]}>
                    <Text style={styles.exploreBtnText}>Browse Full Catalog</Text>
                  </View>
                )}
              </SpatialNavigationFocusableView>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {savedMovies.map((item) => (
                <SpatialNavigationFocusableView
                  key={item.id}
                  onSelect={() => navigateToDetails(item)}
                >
                  {({ isFocused: focused }: { isFocused: boolean }) => (
                    <View style={styles.cardWrapper}>
                      <View style={[styles.posterBox, focused && styles.posterBoxFocused]}>
                        <Image
                          source={{ uri: item.posterUrl || item.headerImage || item.backdropUrl }}
                          style={styles.posterImage}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.cardInfoBeneath}>
                        <Text style={[styles.cardTitleBeneath, focused && styles.cardTitleFocused]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.cardMetaBeneath}>
                          {item.releaseYear} • {item.genres ? item.genres[0] : 'Feature'}
                        </Text>
                      </View>
                    </View>
                  )}
                </SpatialNavigationFocusableView>
              ))}
            </View>
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
  gridScroll: {
    flex: 1,
    overflow: 'hidden',
  },
  gridContent: {
    paddingHorizontal: 64, // Standard 64px alignment
    paddingTop: 24,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerCount: {
    color: '#00A8E1',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    maxWidth: 420,
    marginBottom: 24,
  },
  exploreBtn: {
    backgroundColor: '#00A8E1',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  exploreBtnFocused: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  exploreBtnText: {
    color: '#040714',
    fontSize: 15,
    fontWeight: '800',
  },
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
  cardMetaBeneath: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
});
